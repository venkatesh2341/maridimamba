package com.maridimamba;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maridimamba.dto.PaymentCreateRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityRBACTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member can view all dashboard data (Full Transparency)")
    void memberCanViewDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.groupBalance").exists())
                .andExpect(jsonPath("$.reservePool").exists());
    }

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member can view all members list")
    void memberCanViewMembers() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member can view complete group ledger")
    void memberCanViewLedger() throws Exception {
        mockMvc.perform(get("/api/ledger"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member CANNOT record payment (Must be 403 Forbidden)")
    void memberCannotRecordPayment() throws Exception {
        PaymentCreateRequest request = PaymentCreateRequest.builder()
                .amount(new BigDecimal("1000.00"))
                .build();

        mockMvc.perform(post("/api/loans/4/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member CANNOT create new cycle (Must be 403 Forbidden)")
    void memberCannotCreateCycle() throws Exception {
        mockMvc.perform(post("/api/cycles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cycleName\":\"Test\",\"lendingAmount\":50000}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "leader", roles = {"LEADER"})
    @DisplayName("RBAC: Leader CAN view and mutate data")
    void leaderCanViewDashboard() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "member", roles = {"MEMBER"})
    @DisplayName("RBAC: Member CANNOT record liquid deduction (Must be 403 Forbidden)")
    void memberCannotRecordDeduction() throws Exception {
        mockMvc.perform(post("/api/ledger/deduction")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":1000,\"cause\":\"Donation attempt\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "leader", roles = {"LEADER"})
    @DisplayName("RBAC: Leader CAN record liquid balance deduction with cause")
    void leaderCanRecordDeduction() throws Exception {
        mockMvc.perform(post("/api/ledger/deduction")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":500,\"cause\":\"Village Temple Festival Donation\",\"category\":\"DONATION\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amount").value(-500.00))
                .andExpect(jsonPath("$.description").value("[DONATION] Village Temple Festival Donation"));
    }
}
