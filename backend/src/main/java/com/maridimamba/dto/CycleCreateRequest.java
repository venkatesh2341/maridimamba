package com.maridimamba.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CycleCreateRequest {

    @NotBlank(message = "Cycle name is required (e.g. October 2026)")
    private String cycleName;

    @NotNull(message = "Month date is required")
    private LocalDate monthDate;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Lending amount is required")
    @DecimalMin(value = "0.00", message = "Lending amount cannot be negative")
    private BigDecimal lendingAmount;

    private BigDecimal chunkAmount;

    private Integer numberOfChunks;

    private String chunkBreakdown;

    private String notes;
}
