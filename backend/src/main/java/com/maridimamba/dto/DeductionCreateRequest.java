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
public class DeductionCreateRequest {

    @NotNull(message = "Reduction amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Cause or purpose for reducing group balance is mandatory")
    private String cause;

    private String category; // e.g. DONATION, COMMUNITY_WELFARE, MAINTENANCE, OTHER_EXPENSE

    private LocalDate date;

    private String notes;
}
