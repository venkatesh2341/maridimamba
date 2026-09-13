package com.maridimamba.controller;

import com.maridimamba.dto.MonthlyReportDto;
import com.maridimamba.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly/{cycleId}")
    public ResponseEntity<MonthlyReportDto> getMonthlyReport(@PathVariable Long cycleId) {
        return ResponseEntity.ok(reportService.getMonthlyReport(cycleId));
    }

    @GetMapping(value = "/monthly/{cycleId}/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportMonthlyReportCsv(@PathVariable Long cycleId) {
        String csv = reportService.generateCsvReport(cycleId);
        byte[] csvBytes = csv.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cycle-" + cycleId + "-report.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
