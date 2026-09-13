package com.maridimamba.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CycleCloseRequest {
    private boolean confirmWithUnpaidLoans;
    private String notes;
}
