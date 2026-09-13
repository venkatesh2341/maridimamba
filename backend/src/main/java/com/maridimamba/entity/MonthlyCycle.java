package com.maridimamba.entity;

import com.maridimamba.enums.CycleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_cycles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyCycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cycle_name", nullable = false, length = 50)
    private String cycleName; // e.g. "September 2026"

    @Column(name = "month_date", nullable = false)
    private LocalDate monthDate;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "opening_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "lending_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal lendingAmount;

    @Column(name = "reserve_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal reserveAmount;

    @Column(name = "chunk_amount", precision = 15, scale = 2)
    private BigDecimal chunkAmount;

    @Column(name = "chunk_breakdown", length = 200)
    private String chunkBreakdown;

    @Column(name = "number_of_chunks", nullable = false)
    private Integer numberOfChunks;

    @Column(name = "closing_balance", precision = 15, scale = 2)
    private BigDecimal closingBalance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CycleStatus status = CycleStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reserveAmount == null && openingBalance != null && lendingAmount != null) {
            reserveAmount = openingBalance.subtract(lendingAmount);
        }
    }
}
