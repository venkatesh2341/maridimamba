package com.maridimamba.repository;

import com.maridimamba.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findByEntityTypeOrderByCreatedAtDesc(String entityType);
}
