package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.repository.OtpRecordRepository;
import com.yxw1268.fyp.service.OtpRecordService;
import com.yxw1268.fyp.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.yxw1268.fyp.domain.OtpRecord}.
 */
@RestController
@RequestMapping("/api/otp-records")
public class OtpRecordResource {

    private static final Logger LOG = LoggerFactory.getLogger(OtpRecordResource.class);

    private static final String ENTITY_NAME = "otpRecord";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final OtpRecordService otpRecordService;

    private final OtpRecordRepository otpRecordRepository;

    public OtpRecordResource(OtpRecordService otpRecordService, OtpRecordRepository otpRecordRepository) {
        this.otpRecordService = otpRecordService;
        this.otpRecordRepository = otpRecordRepository;
    }

    /**
     * {@code POST  /otp-records} : Create a new otpRecord.
     *
     * @param otpRecord the otpRecord to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new otpRecord, or with status {@code 400 (Bad Request)} if the otpRecord has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<OtpRecord> createOtpRecord(@Valid @RequestBody OtpRecord otpRecord) throws URISyntaxException {
        LOG.debug("REST request to save OtpRecord : {}", otpRecord);
        if (otpRecord.getId() != null) {
            throw new BadRequestAlertException("A new otpRecord cannot already have an ID", ENTITY_NAME, "idexists");
        }
        otpRecord = otpRecordService.save(otpRecord);
        return ResponseEntity.created(new URI("/api/otp-records/" + otpRecord.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, otpRecord.getId().toString()))
            .body(otpRecord);
    }

    /**
     * {@code PUT  /otp-records/:id} : Updates an existing otpRecord.
     *
     * @param id the id of the otpRecord to save.
     * @param otpRecord the otpRecord to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated otpRecord,
     * or with status {@code 400 (Bad Request)} if the otpRecord is not valid,
     * or with status {@code 500 (Internal Server Error)} if the otpRecord couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<OtpRecord> updateOtpRecord(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody OtpRecord otpRecord
    ) throws URISyntaxException {
        LOG.debug("REST request to update OtpRecord : {}, {}", id, otpRecord);
        if (otpRecord.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, otpRecord.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!otpRecordRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        otpRecord = otpRecordService.update(otpRecord);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, otpRecord.getId().toString()))
            .body(otpRecord);
    }

    /**
     * {@code PATCH  /otp-records/:id} : Partial updates given fields of an existing otpRecord, field will ignore if it is null
     *
     * @param id the id of the otpRecord to save.
     * @param otpRecord the otpRecord to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated otpRecord,
     * or with status {@code 400 (Bad Request)} if the otpRecord is not valid,
     * or with status {@code 404 (Not Found)} if the otpRecord is not found,
     * or with status {@code 500 (Internal Server Error)} if the otpRecord couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<OtpRecord> partialUpdateOtpRecord(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody OtpRecord otpRecord
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update OtpRecord partially : {}, {}", id, otpRecord);
        if (otpRecord.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, otpRecord.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!otpRecordRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<OtpRecord> result = otpRecordService.partialUpdate(otpRecord);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, otpRecord.getId().toString())
        );
    }

    /**
     * {@code GET  /otp-records} : get all the otpRecords.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of otpRecords in body.
     */
    @GetMapping("")
    public List<OtpRecord> getAllOtpRecords() {
        LOG.debug("REST request to get all OtpRecords");
        return otpRecordService.findAll();
    }

    /**
     * {@code GET  /otp-records/:id} : get the "id" otpRecord.
     *
     * @param id the id of the otpRecord to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the otpRecord, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<OtpRecord> getOtpRecord(@PathVariable("id") Long id) {
        LOG.debug("REST request to get OtpRecord : {}", id);
        Optional<OtpRecord> otpRecord = otpRecordService.findOne(id);
        return ResponseUtil.wrapOrNotFound(otpRecord);
    }

    /**
     * {@code DELETE  /otp-records/:id} : delete the "id" otpRecord.
     *
     * @param id the id of the otpRecord to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOtpRecord(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete OtpRecord : {}", id);
        otpRecordService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
