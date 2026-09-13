package com.maridimamba.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChunkAssignRequest {

    @NotEmpty(message = "At least one chunk must be assigned")
    @Valid
    private List<ChunkAssignItem> chunks;
}
