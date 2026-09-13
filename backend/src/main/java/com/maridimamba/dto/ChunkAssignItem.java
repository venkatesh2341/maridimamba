package com.maridimamba.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChunkAssignItem {

    @NotNull(message = "Chunk number is required")
    private Integer chunkNumber;

    @NotNull(message = "Member is required")
    private Long memberId;

    @NotNull(message = "Principal amount is required")
    @DecimalMin(value = "0.01", message = "Principal must be greater than zero")
    private BigDecimal principalAmount;

    @NotNull(message = "Interest amount is required")
    @DecimalMin(value = "0.00", message = "Interest cannot be negative")
    private BigDecimal interestAmount;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    private String notes;
}
