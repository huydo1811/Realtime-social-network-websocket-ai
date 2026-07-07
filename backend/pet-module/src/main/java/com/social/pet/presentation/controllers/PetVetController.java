package com.social.pet.presentation.controllers;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.pet.presentation.dto.VetClinicResponse;

@RestController
@RequestMapping("/pets")
public class PetVetController {

    private static final Logger log = LoggerFactory.getLogger(PetVetController.class);
    private static final double EARTH_RADIUS_KM = 6371.0;

    private static final String[] OVERPASS_ENDPOINTS = {
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    };

    private static RestTemplate makeRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(java.time.Duration.ofSeconds(5));
        factory.setReadTimeout(java.time.Duration.ofSeconds(12));
        return new RestTemplate(factory);
    }

    private static final RestTemplate restTemplate = makeRestTemplate();
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    private final ObjectMapper objectMapper;

    public PetVetController() {
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/vets/nearby")
    public ResponseEntity<?> findNearbyVets(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "6") Double radiusKm) {
        try {
            Future<List<VetClinicResponse>> future = executor.submit(
                    () -> searchOverpass(latitude, longitude, radiusKm));
            List<VetClinicResponse> vets = future.get(12, TimeUnit.SECONDS);
            return ResponseEntity.ok(vets);
        } catch (TimeoutException e) {
            log.warn("Overpass query timed out after 12s for ({}, {})", latitude, longitude);
            return ResponseEntity.ok(List.of());
        } catch (Exception ex) {
            log.error("Error finding nearby vets: {}", ex.getMessage(), ex);
            return ResponseEntity.ok(List.of());
        }
    }

    private List<VetClinicResponse> searchOverpass(double latitude, double longitude, double radiusKm) {
        int radiusMeters = Math.max(500, (int) Math.round(radiusKm * 1000));

        String query = """
            [out:json][timeout:10][maxsize:8388608];
            (
              node(around:%d,%.6f,%.6f)["amenity"="veterinary"];
              way(around:%d,%.6f,%.6f)["amenity"="veterinary"];
              node(around:%d,%.6f,%.6f)["healthcare"="veterinary"];
              way(around:%d,%.6f,%.6f)["healthcare"="veterinary"];
              node(around:%d,%.6f,%.6f)["shop"="pet"];
              way(around:%d,%.6f,%.6f)["shop"="pet"];
            );
            out center tags;
            """.formatted(
                radiusMeters, latitude, longitude,
                radiusMeters, latitude, longitude,
                radiusMeters, latitude, longitude,
                radiusMeters, latitude, longitude,
                radiusMeters, latitude, longitude,
                radiusMeters, latitude, longitude
        );

        for (String endpoint : OVERPASS_ENDPOINTS) {
            try {
                String url = endpoint + "?data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
                log.info("Querying Overpass for vets near ({}, {}) with radius {}m", latitude, longitude, radiusMeters);

                String raw = restTemplate.getForObject(URI.create(url), String.class);
                if (raw == null || raw.isBlank()) continue;

                JsonNode root = objectMapper.readTree(raw);
                if (!root.has("elements") || !root.get("elements").isArray()) continue;

                List<VetClinicResponse> vets = new ArrayList<>();
                for (JsonNode el : root.get("elements")) {
                    VetClinicResponse vet = toVetClinic(el, latitude, longitude);
                    if (vet != null) vets.add(vet);
                }

                vets.sort((a, b) -> Double.compare(a.getDistanceKm(), b.getDistanceKm()));
                log.info("Found {} vets near ({}, {})", vets.size(), latitude, longitude);
                return vets.stream().limit(8).toList();

            } catch (Exception e) {
                log.warn("Overpass endpoint {} failed: {}", endpoint, e.getMessage());
            }
        }
        return List.of();
    }

    private VetClinicResponse toVetClinic(JsonNode el, double userLat, double userLon) {
        Double lat = null, lon = null;
        if (el.has("center") && !el.path("center").isNull()) {
            JsonNode c = el.path("center");
            if (c.path("lat").isNumber()) lat = c.path("lat").asDouble();
            if (c.path("lon").isNumber()) lon = c.path("lon").asDouble();
        }
        if (lat == null && el.path("lat").isNumber()) lat = el.path("lat").asDouble();
        if (lon == null && el.path("lon").isNumber()) lon = el.path("lon").asDouble();
        if (lat == null || lon == null) return null;

        java.util.Map<String, String> tags = java.util.Map.of();
        if (el.has("tags") && el.get("tags").isObject()) {
            var builder = new java.util.HashMap<String, String>();
            el.get("tags").fieldNames().forEachRemaining(key ->
                    builder.put(key, el.get("tags").path(key).asText()));
            tags = java.util.Map.copyOf(builder);
        }

        String amenityType = tags.get("amenity");
        String shopType = tags.get("shop");
        String category = "Phòng khám thú y";
        if ("veterinary".equals(amenityType)) category = "Phòng khám thú y";
        else if ("pet".equals(shopType)) category = "Cửa hàng thú cưng";

        String name = tags.get("name");
        if (name == null || name.isBlank()) {
            name = category;
        } else {
            name = name.trim();
        }

        String phone = firstNonBlank(tags.get("contact:phone"), tags.get("phone"), tags.get("mobile"));
        String website = firstNonBlank(tags.get("website"), tags.get("contact:website"), tags.get("url"));
        String openingHours = tags.get("opening_hours");

        String address = formatAddress(tags);

        return new VetClinicResponse(
                String.valueOf(el.path("id").asLong()),
                name,
                lat, lon,
                address,
                phone,
                website,
                openingHours,
                haversineKm(userLat, userLon, lat, lon)
        );
    }

    private String formatAddress(java.util.Map<String, String> tags) {
        var parts = new java.util.ArrayList<String>();
        String hn = tags.get("addr:housenumber");
        String street = tags.get("addr:street");
        String suburb = tags.get("addr:suburb");
        String ward = tags.get("addr:ward");
        String city = tags.get("addr:city");
        String district = tags.get("addr:district");

        if (hn != null && !hn.isBlank()) parts.add(hn.trim());
        if (street != null && !street.isBlank()) parts.add(street.trim());
        if (suburb != null && !suburb.isBlank()) parts.add(suburb.trim());
        if (ward != null && !ward.isBlank()) parts.add(ward.trim());
        if (district != null && !district.isBlank()) parts.add(district.trim());
        if (city != null && !city.isBlank()) parts.add(city.trim());

        return parts.isEmpty() ? "Địa chỉ chưa rõ" : String.join(", ", parts);
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v.trim();
        }
        return null;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
