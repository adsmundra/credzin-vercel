package com.credzin.merchant.common.db

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class Auditable {

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    var createdBy: String? = null

    @CreatedDate
    @Column(name = "created_on", nullable = false, updatable = false)
    var createdOn: LocalDateTime? = null

    @LastModifiedBy
    @Column(name = "updated_by")
    var updatedBy: String? = null

    @LastModifiedDate
    @Column(name = "updated_on")
    var updatedOn: LocalDateTime? = null
}
