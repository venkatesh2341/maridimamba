package com.maridimamba.service;

import com.maridimamba.entity.AuditLog;
import com.maridimamba.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(String action, String entityType, String entityId, String oldValue, String newValue) {
        String username = "system";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            username = auth.getName();
        }

        AuditLog auditLog = AuditLog.builder()
                .userId(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress("127.0.0.1")
                .build();

        auditLogRepository.save(auditLog);
        log.info("AUDIT: User [{}] performed [{}] on [{}] id=[{}]", username, action, entityType, entityId);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }
}
