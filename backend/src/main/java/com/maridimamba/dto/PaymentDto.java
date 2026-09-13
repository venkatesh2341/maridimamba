package com.maridimamba.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private Long id;
    private Long loanId;
    private Long memberId;
    private String memberName;
    private Long cycleId;
    private String cycleName;
    private BigDecimal amount;
    private BigDecimal principalPortion;
    private BigDecimal interestPortion;
    private LocalDateTime paymentDate;
    private String recordedBy;
    private String notes;
    private LocalDateTime createdAt;
}
