package com.maridimamba.dto;

import com.maridimamba.enums.LoanStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanDto {
    private Long id;
    private Long cycleId;
    private String cycleName;
    private Long memberId;
    private String memberName;
    private String memberPhone;
    private Integer chunkNumber;
    private BigDecimal principalAmount;
    private BigDecimal interestAmount;
    private BigDecimal totalDue;
    private BigDecimal amountPaid;
    private BigDecimal remainingAmount;
    private LocalDate dueDate;
    private LoanStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
