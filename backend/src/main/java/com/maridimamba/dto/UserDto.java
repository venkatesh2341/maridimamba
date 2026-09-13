package com.maridimamba.dto;

import com.maridimamba.enums.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private Role role;
    private String phone;
    private boolean active;
}
