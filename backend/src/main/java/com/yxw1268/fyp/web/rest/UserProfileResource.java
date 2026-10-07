package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.security.AuthoritiesConstants;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.UserProfileService;
import com.yxw1268.fyp.service.dto.UserDTO;
import com.yxw1268.fyp.service.dto.UserProfileDTO;
import com.yxw1268.fyp.service.mapper.UserProfileMapper;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.ResponseUtil;
import java.util.Collections;

/**
 * REST controller for managing {@link com.yxw1268.fyp.domain.UserProfile}.
 */
@RestController
@RequestMapping("/api/user-profiles")
public class UserProfileResource {

    private static final Logger LOG = LoggerFactory.getLogger(UserProfileResource.class);

    private static final String ENTITY_NAME = "userProfile";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final UserProfileService userProfileService;

    private final UserProfileRepository userProfileRepository;

    private final UserRepository userRepository;

    private final com.yxw1268.fyp.service.mapper.UserProfileMapper userProfileMapper;

    public UserProfileResource(
        UserProfileService userProfileService,
        UserProfileRepository userProfileRepository,
        UserRepository userRepository,
        UserProfileMapper userProfileMapper) {
        this.userProfileService = userProfileService;
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.userProfileMapper = userProfileMapper;
    }

    /**
     * {@code POST  /user-profiles} : Create a new userProfile.
     *
     * @param userProfileDTO the userProfileDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new userProfileDTO, or with status {@code 400 (Bad Request)} if the userProfile has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<UserProfileDTO> createUserProfile(@RequestBody UserProfileDTO userProfileDTO) throws URISyntaxException {
        LOG.debug("REST request to save UserProfile : {}", userProfileDTO);

        // A profile always belongs to the authenticated user, whatever the request body says
        User currentUser = currentUser();
        String currentLogin = currentUser.getLogin();
        userProfileDTO.setUser(new UserDTO(currentUser));

        Optional<UserProfile> existing = userProfileRepository.findOneByUserLogin(currentLogin);

        // If profile exists, UPDATE instead of INSERT
        if (existing.isPresent()) {
            LOG.info("Profile already exists for user {}, updating", currentLogin);
            UserProfile existingProfile = existing.orElseThrow();
            userProfileDTO.setId(existingProfile.getId());
            if (userProfileDTO.getCreatedAt() == null) {
                userProfileDTO.setCreatedAt(existingProfile.getCreatedAt());
            }
            userProfileDTO = userProfileService.update(userProfileDTO);
            return ResponseEntity.ok()
                .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, userProfileDTO.getId().toString()))
                .body(userProfileDTO);
        }

        // New profile: INSERT (with try-catch for race condition)
        if (userProfileDTO.getId() != null) {
            throw new BadRequestAlertException("A new userProfile cannot already have an ID", ENTITY_NAME, "idexists");
        }
        if (userProfileDTO.getCreatedAt() == null) {
            userProfileDTO.setCreatedAt(java.time.Instant.now());
        }
        try {
            userProfileDTO = userProfileService.save(userProfileDTO);
            return ResponseEntity.created(new URI("/api/user-profiles/" + userProfileDTO.getId()))
                .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, userProfileDTO.getId().toString()))
                .body(userProfileDTO);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Race condition
            LOG.warn("Duplicate key on insert, retrying as update for user {}", currentLogin);
            Optional<UserProfile> retry = userProfileRepository.findOneByUserLogin(currentLogin);
            if (retry.isPresent()) {
                UserProfile existingProfile = retry.orElseThrow();
                userProfileDTO.setId(existingProfile.getId());
                userProfileDTO.setCreatedAt(existingProfile.getCreatedAt());
                userProfileDTO = userProfileService.update(userProfileDTO);
                return ResponseEntity.ok().body(userProfileDTO);
            }
            throw new RuntimeException("Failed to save profile after retry", e);
        }
    }

    /**
     * {@code PUT  /user-profiles/:id} : Updates an existing userProfile.
     *
     * @param id the id of the userProfileDTO to save.
     * @param userProfileDTO the userProfileDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated userProfileDTO,
     * or with status {@code 400 (Bad Request)} if the userProfileDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the userProfileDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDTO> updateUserProfile(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody UserProfileDTO userProfileDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update UserProfile : {}, {}", id, userProfileDTO);
        if (userProfileDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, userProfileDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        UserProfile existing = findAccessibleProfile(id).orElseThrow(() ->
            new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound")
        );
        // The owner of a profile can't be changed
        userProfileDTO.setUser(new UserDTO(existing.getUser()));
        if (userProfileDTO.getCreatedAt() == null) {
            userProfileDTO.setCreatedAt(existing.getCreatedAt());
        }

        userProfileDTO = userProfileService.update(userProfileDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, userProfileDTO.getId().toString()))
            .body(userProfileDTO);
    }

    /**
     * {@code PATCH  /user-profiles/:id} : Partial updates given fields of an existing userProfile, field will ignore if it is null
     *
     * @param id the id of the userProfileDTO to save.
     * @param userProfileDTO the userProfileDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated userProfileDTO,
     * or with status {@code 400 (Bad Request)} if the userProfileDTO is not valid,
     * or with status {@code 404 (Not Found)} if the userProfileDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the userProfileDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<UserProfileDTO> partialUpdateUserProfile(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody UserProfileDTO userProfileDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update UserProfile partially : {}, {}", id, userProfileDTO);
        if (userProfileDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, userProfileDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (findAccessibleProfile(id).isEmpty()) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }
        // The owner of a profile can't be changed (null fields are left untouched)
        userProfileDTO.setUser(null);

        Optional<UserProfileDTO> result = userProfileService.partialUpdate(userProfileDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, userProfileDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /user-profiles} : get current user's profile.
     */
    @GetMapping("")
    public ResponseEntity<List<UserProfileDTO>> getAllUserProfiles(
      @org.springdoc.core.annotations.ParameterObject Pageable pageable,
      @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
      LOG.debug("REST request to get UserProfile for current user");

      String currentUserLogin = SecurityUtils.getCurrentUserLogin().orElse("");

      Optional<UserProfile> profile = 
          userProfileRepository.findOneByUserLogin(currentUserLogin);

      List<UserProfileDTO> result = profile
        .map(userProfileMapper::toDto)
        .map(Collections::singletonList)
        .orElse(Collections.emptyList());

    return ResponseEntity.ok().body(result);
    }

    /**
     * {@code GET  /user-profiles/:id} : get the "id" userProfile.
     *
     * @param id the id of the userProfileDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the userProfileDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable("id") Long id) {
        LOG.debug("REST request to get UserProfile : {}", id);
        Optional<UserProfileDTO> userProfileDTO = findAccessibleProfile(id).map(userProfileMapper::toDto);
        return ResponseUtil.wrapOrNotFound(userProfileDTO);
    }

    /**
     * {@code DELETE  /user-profiles/:id} : delete the "id" userProfile.
     *
     * @param id the id of the userProfileDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserProfile(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete UserProfile : {}", id);
        if (findAccessibleProfile(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        userProfileService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    private User currentUser() {
        return SecurityUtils.getCurrentUserLogin()
            .flatMap(userRepository::findOneByLogin)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    /**
     * The profile with this id, if it exists and the current user may access it:
     * users only see their own profile, admins see any.
     */
    private Optional<UserProfile> findAccessibleProfile(Long id) {
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        boolean isAdmin = SecurityUtils.hasCurrentUserThisAuthority(AuthoritiesConstants.ADMIN);
        return userProfileRepository
            .findOneWithToOneRelationships(id)
            .filter(profile -> isAdmin || (profile.getUser() != null && currentLogin.equals(profile.getUser().getLogin())));
    }
}
