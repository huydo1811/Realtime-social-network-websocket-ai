package com.social.pet.presentation.dto;

public class VetClinicResponse {
    private String id;
    private String name;
    private Double latitude;
    private Double longitude;
    private String address;
    private String phone;
    private String website;
    private String openingHours;
    private Double distanceKm;

    public VetClinicResponse() {}

    public VetClinicResponse(String id, String name, Double latitude, Double longitude,
                             String address, String phone, String website,
                             String openingHours, Double distanceKm) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.phone = phone;
        this.website = website;
        this.openingHours = openingHours;
        this.distanceKm = distanceKm;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
}
