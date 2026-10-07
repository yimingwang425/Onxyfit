package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.security.AuthoritiesConstants;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.PlanService;
import com.yxw1268.fyp.service.dto.PlanDTO;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.yxw1268.fyp.domain.Plan}.
 */
@RestController
@RequestMapping("/api/plans")
public class PlanResource {

    private static final Logger LOG = LoggerFactory.getLogger(PlanResource.class);

    private static final String ENTITY_NAME = "plan";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PlanService planService;

    private final PlanRepository planRepository;

    public PlanResource(PlanService planService, PlanRepository planRepository) {
        this.planService = planService;
        this.planRepository = planRepository;
    }

    /**
     * {@code POST  /plans} : Create a new plan. Admin only: users get their plans from {@code /plans/generate}.
     */
    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PlanDTO> createPlan(@Valid @RequestBody PlanDTO planDTO) throws URISyntaxException {
        LOG.debug("REST request to save Plan : {}", planDTO);
        if (planDTO.getId() != null) {
            throw new BadRequestAlertException("A new plan cannot already have an ID", ENTITY_NAME, "idexists");
        }
        planDTO = planService.save(planDTO);
        return ResponseEntity.created(new URI("/api/plans/" + planDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, planDTO.getId().toString()))
            .body(planDTO);
    }

    /**
     * {@code PUT  /plans/:id} : Updates an existing plan.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PlanDTO> updatePlan(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody PlanDTO planDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Plan : {}, {}", id, planDTO);
        if (planDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, planDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!planRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        planDTO = planService.update(planDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, planDTO.getId().toString()))
            .body(planDTO);
    }

    /**
     * {@code PATCH  /plans/:id} : Partial updates given fields of an existing plan.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PlanDTO> partialUpdatePlan(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody PlanDTO planDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Plan partially : {}, {}", id, planDTO);
        if (planDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, planDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!planRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PlanDTO> result = planService.partialUpdate(planDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, planDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /plans} : get the current user's plans (all plans for an admin).
     */
    @GetMapping("")
    public ResponseEntity<List<PlanDTO>> getAllPlans(@org.springdoc.core.annotations.ParameterObject Pageable pageable) {
        LOG.debug("REST request to get a page of Plans");
        Page<PlanDTO> page = isAdmin() ? planService.findAll(pageable) : planService.findAllForUser(currentLogin(), pageable);
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        return ResponseEntity.ok().headers(headers).body(page.getContent());
    }

    /**
     * {@code GET  /plans/current} : get the plan the current user is on, or 404 if none was generated yet.
     */
    @GetMapping("/current")
    public ResponseEntity<PlanDTO> getCurrentPlan() {
        LOG.debug("REST request to get the current Plan");
        return ResponseUtil.wrapOrNotFound(planService.findCurrentForUser(currentLogin()));
    }

    /**
     * {@code GET  /plans/:id} : get the "id" plan.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlanDTO> getPlan(@PathVariable("id") Long id) {
        LOG.debug("REST request to get Plan : {}", id);
        Optional<PlanDTO> planDTO = canAccess(id) ? planService.findOne(id) : Optional.empty();
        return ResponseUtil.wrapOrNotFound(planDTO);
    }

    /**
     * {@code DELETE  /plans/:id} : delete the "id" plan.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete Plan : {}", id);
        if (!canAccess(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        planService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    /**
     * {@code POST  /plans/generate} : Generate a new AI-powered plan for current user.
     */
    @PostMapping("/generate")
    public ResponseEntity<PlanDTO> generatePlan() {
        LOG.info("REST request to generate AI plan for current user");
        
        try {
            PlanDTO planDTO = planService.generatePlanForCurrentUser();
            
            return ResponseEntity.ok()
                .headers(HeaderUtil.createAlert(applicationName, "AI plan generated successfully", planDTO.getId().toString()))
                .body(planDTO);
        } catch (Exception e) {
            LOG.error("Failed to generate AI plan", e);
            throw new RuntimeException("Failed to generate AI plan: " + e.getMessage());
        }
    }

    private static boolean isAdmin() {
        return SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN);
    }

    private static String currentLogin() {
        return SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    /** Users may only touch plans attached to their own profile. */
    private boolean canAccess(Long planId) {
        return isAdmin()
            ? planRepository.existsById(planId)
            : planRepository.existsByIdAndProfile_User_Login(planId, currentLogin());
    }
}
