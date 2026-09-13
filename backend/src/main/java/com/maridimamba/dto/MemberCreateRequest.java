package com.maridimamba.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberCreateRequest {

    @NotBlank(message = "Member name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String address;
    private String notes;
}
