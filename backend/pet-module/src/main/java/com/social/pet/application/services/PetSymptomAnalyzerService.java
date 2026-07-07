package com.social.pet.application.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetDiagnosisSeverity;
import com.social.pet.domain.entities.PetSymptomReport;

@Service
public class PetSymptomAnalyzerService {
    public DiagnosisResult analyze(PetSymptomReport report, PetSpecies species) {
        String text = (report.getSymptomsText() == null ? "" : report.getSymptomsText()).toLowerCase(Locale.ROOT);
        List<String> causes = new ArrayList<>();
        List<String> advice = new ArrayList<>();
        List<String> redFlags = new ArrayList<>();
        List<DiseaseCandidate> candidates = new ArrayList<>();
        PetDiagnosisSeverity severity = PetDiagnosisSeverity.LOW;
        int confidence = 60;

        boolean breathing = bool(report.getBreathingDifficulty())
                || containsAny(text, "khó thở", "thở gấp", "thở khò khè");
        boolean emergencyVomiting = bool(report.getVomiting()) && containsAny(text, "liên tục", "ra máu", "máu");
        boolean emergencyDiarrhea = bool(report.getDiarrhea()) && containsAny(text, "ra máu", "liên tục", "nhiều lần");
        boolean fever = report.getTemperatureC() != null && report.getTemperatureC() >= 39.5;
        boolean highFever = report.getTemperatureC() != null && report.getTemperatureC() >= 40.0;
        boolean lowAppetite = bool(report.getAppetiteLoss()) || containsAny(text, "bỏ ăn", "chán ăn", "ăn ít");
        boolean lowEnergy = bool(report.getEnergyDrop()) || containsAny(text, "lờ đờ", "mệt", "uể oải");
        boolean diarrhea = bool(report.getDiarrhea()) || containsAny(text, "tiêu chảy", "đi ngoài", "phân lỏng");
        boolean vomiting = bool(report.getVomiting()) || containsAny(text, "nôn", "ói", "ói mửa");
        boolean sneezing = containsAny(text, "hắt hơi", "sổ mũi", "chảy mũi", "ho", "khò khè");
        boolean itchSkin = bool(report.getSkinRash()) || containsAny(text, "ngứa", "rụng lông", "đỏ da", "phát ban");
        boolean urinary = containsAny(text, "tiểu", "đi tiểu", "tiểu buốt", "khó tiểu", "máu trong nước tiểu");
        boolean abdominal = containsAny(text, "đau bụng", "bụng trướng", "bụng cứng", "co ro", "ôm bụng");
        boolean dehydration = containsAny(text, "mất nước", "khô nướu", "uống ít nước", "khát nhiều");

        if (breathing || highFever || containsAny(text, "co giật", "ngất", "mất ý thức")) {
            severity = PetDiagnosisSeverity.EMERGENCY;
            confidence = 95;
            candidates.add(new DiseaseCandidate("Sốc nhiệt / cấp cứu hô hấp", 100));
            candidates.add(new DiseaseCandidate("Nguy cơ thần kinh cấp tính", 96));
            causes.add("Nguy cơ cấp cứu hô hấp hoặc thần kinh");
            redFlags.add("Khó thở, co giật, ngất, mất ý thức, sốt rất cao");
            advice.add("Đưa thú cưng đến bác sĩ thú y ngay lập tức.");
        } else if (emergencyVomiting || emergencyDiarrhea || containsAny(text, "đi ngoài ra máu", "nôn ra máu")) {
            severity = PetDiagnosisSeverity.HIGH;
            confidence = 90;
            candidates.add(species == PetSpecies.CAT
                    ? new DiseaseCandidate("Feline panleukopenia / viêm ruột nhiễm trùng", 94)
                    : new DiseaseCandidate("Parvovirus / viêm dạ dày ruột do virus", 94));
            candidates.add(new DiseaseCandidate("Viêm dạ dày ruột cấp / mất nước", 88));
            causes.add("Rối loạn tiêu hóa nặng hoặc mất nước");
            redFlags.add("Nôn ra máu, đi ngoài ra máu, mất nước, bỏ ăn kéo dài");
            advice.add("Theo dõi uống nước, tránh tự dùng thuốc và liên hệ thú y trong ngày.");
        } else if ((vomiting && diarrhea && lowAppetite && lowEnergy) || (fever && vomiting && diarrhea)) {
            severity = PetDiagnosisSeverity.HIGH;
            confidence = 88;
            candidates.add(species == PetSpecies.CAT
                    ? new DiseaseCandidate("Feline panleukopenia / viêm ruột nhiễm trùng", 92)
                    : new DiseaseCandidate("Parvovirus / viêm dạ dày ruột do virus", 92));
            candidates.add(new DiseaseCandidate("Viêm dạ dày ruột cấp", 86));
            candidates.add(new DiseaseCandidate("Mất nước / rối loạn điện giải", 84));
            causes.add("Hội chứng tiêu hóa cấp tính");
            redFlags.add("Nôn + tiêu chảy + bỏ ăn + lờ đờ");
            advice.add("Cần khám thú y trong ngày để đánh giá mất nước và nhiễm trùng.");
        } else if (fever || bool(report.getCough()) || sneezing) {
            severity = PetDiagnosisSeverity.MODERATE;
            confidence = 78;
            candidates.add(new DiseaseCandidate("Nhiễm trùng hô hấp trên / kennel cough", 87));
            candidates.add(new DiseaseCandidate("Viêm phổi sớm", 76));
            causes.add("Triệu chứng viêm đường hô hấp hoặc nhiễm trùng nhẹ");
            redFlags.add("Sốt, ho kéo dài, bỏ ăn, khó thở tăng dần");
            advice.add("Cách ly nguồn nghi ngờ, theo dõi 24-48 giờ và đặt lịch khám nếu không cải thiện.");
        } else if (itchSkin) {
            severity = PetDiagnosisSeverity.MODERATE;
            confidence = 74;
            candidates.add(new DiseaseCandidate("Viêm da dị ứng / dị ứng thức ăn", 90));
            candidates.add(new DiseaseCandidate("Ký sinh trùng ngoài da / ghẻ", 86));
            causes.add("Kích ứng da hoặc dị ứng");
            redFlags.add("Ngứa nhiều, rụng lông thành mảng, da đỏ hoặc rỉ dịch");
            advice.add("Kiểm tra ve/bọ chét và đưa đi khám nếu da đỏ lan rộng hoặc ngứa dữ dội.");
        } else if (urinary) {
            severity = PetDiagnosisSeverity.MODERATE;
            confidence = 72;
            candidates.add(new DiseaseCandidate("Nhiễm trùng đường tiết niệu", 89));
            candidates.add(new DiseaseCandidate("Sỏi tiết niệu / kích ứng bàng quang", 84));
            causes.add("Bất thường đường tiết niệu");
            redFlags.add("Tiểu buốt, tiểu ít, tiểu ra máu, bí tiểu");
            advice.add("Không trì hoãn nếu có bí tiểu hoặc tiểu ra máu, nhất là ở mèo đực.");
        } else if (abdominal || (vomiting && lowAppetite && !diarrhea)) {
            severity = PetDiagnosisSeverity.MODERATE;
            confidence = 70;
            candidates.add(new DiseaseCandidate("Dị vật / tắc nghẽn tiêu hoá sớm", 84));
            candidates.add(new DiseaseCandidate("Viêm dạ dày", 80));
            causes.add("Rối loạn tiêu hoá hoặc tắc nghẽn sớm");
            redFlags.add("Nôn lặp lại, bụng trướng, đau bụng, không đi ngoài");
            advice.add("Theo dõi chặt, nếu nôn lặp lại hoặc bụng trướng thì khám ngay.");
        } else if (dehydration || lowAppetite || lowEnergy) {
            severity = PetDiagnosisSeverity.MODERATE;
            confidence = 68;
            candidates.add(new DiseaseCandidate("Suy nhược nhẹ / stress", 74));
            candidates.add(new DiseaseCandidate("Rối loạn tiêu hoá nhẹ", 72));
            causes.add("Giảm ăn hoặc mệt mỏi không đặc hiệu");
            redFlags.add("Bỏ ăn > 24h, nôn liên tục, lờ đờ tăng dần");
            advice.add("Tiếp tục theo dõi tại nhà, ghi lại tần suất và mức độ triệu chứng.");
        } else {
            advice.add("Tiếp tục theo dõi tại nhà, ghi lại tần suất và mức độ triệu chứng.");
            candidates.add(new DiseaseCandidate("Chưa đủ dữ liệu để kết luận", 55));
        }

        if (lowAppetite) {
            causes.add("Giảm ăn hoặc bỏ ăn");
            advice.add("Khuyến khích ăn lượng nhỏ, dễ tiêu.");
        }
        if (lowEnergy) {
            causes.add("Giảm năng lượng hoặc mệt mỏi");
        }
        if (bool(report.getSkinRash())) {
            causes.add("Kích ứng da hoặc dị ứng");
        }
        if (bool(report.getVomiting())) {
            causes.add("Buồn nôn / nôn");
        }
        if (bool(report.getDiarrhea())) {
            causes.add("Rối loạn tiêu hóa / tiêu chảy");
        }

        if (dehydration) {
            redFlags.add("Dấu hiệu mất nước hoặc uống ít nước");
        }

        candidates.sort(Comparator.comparingInt(DiseaseCandidate::score).reversed());
        String likelyDisease = candidates.get(0).name();
        String differentialDiagnoses = candidates.stream()
                .map(candidate -> candidate.name() + " (" + candidate.score() + ")")
                .distinct()
                .limit(3)
                .reduce((left, right) -> left + "; " + right)
                .orElse(likelyDisease);

        String summary;
        switch (severity) {
            case EMERGENCY -> summary = "Dấu hiệu nguy cấp, cần khám thú y ngay";
            case HIGH -> summary = "Triệu chứng khớp với bệnh lý tiêu hóa / nhiễm trùng, nên đi khám sớm";
            case MODERATE -> summary = "Có dấu hiệu phù hợp với một vài bệnh khả dĩ, nên theo dõi sát hoặc khám sớm";
            default -> summary = "Chưa thấy dấu hiệu nặng, tiếp tục quan sát";
        }

        String recommendation = String.join(" ", advice).trim();
        if (recommendation.isBlank()) {
            recommendation = "Tiếp tục ghi nhận triệu chứng, nếu kéo dài hoặc nặng hơn hãy đưa thú cưng đi khám.";
        }

        String redFlagsText = joinDistinct(redFlags);
        if (redFlagsText == null) {
            redFlagsText = severity == PetDiagnosisSeverity.LOW ? "Chưa ghi nhận red flags rõ ràng"
                    : "Cần theo dõi sát red flags";
        }

        return new DiagnosisResult(
                severity,
                likelyDisease,
                summary,
                joinDistinct(causes),
                differentialDiagnoses,
                redFlagsText,
                recommendation,
                severity == PetDiagnosisSeverity.EMERGENCY || severity == PetDiagnosisSeverity.HIGH,
                confidence);
    }

    private static boolean bool(Boolean value) {
        return value != null && value;
    }

    private static boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private static String joinDistinct(List<String> values) {
        return values.stream().distinct().reduce((left, right) -> left + "; " + right).orElse(null);
    }

    public record DiagnosisResult(
            PetDiagnosisSeverity severity,
            String likelyDisease,
            String summary,
            String possibleCauses,
            String differentialDiagnoses,
            String redFlags,
            String recommendation,
            boolean shouldSeeVet,
            int confidenceScore) {
    }

    private record DiseaseCandidate(String name, int score) {
    }
}