package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.repository.OtpRecordRepository;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.MailService;
import com.yxw1268.fyp.service.OtpService;
import com.yxw1268.fyp.service.OtpService.Purpose;
import com.yxw1268.fyp.service.UserService;
import com.yxw1268.fyp.service.dto.AdminUserDTO;
import com.yxw1268.fyp.service.dto.PasswordChangeDTO;
import com.yxw1268.fyp.web.rest.errors.*;
import com.yxw1268.fyp.web.rest.vm.KeyAndPasswordVM;
import com.yxw1268.fyp.web.rest.vm.ManagedUserVM;
import jakarta.validation.Valid;
import java.util.*;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing the current user's account.
 */
@RestController
@RequestMapping("/api")
public class AccountResource {

    private static class AccountResourceException extends RuntimeException {

        private AccountResourceException(String message) {
            super(message);
        }
    }

    private static final Logger LOG = LoggerFactory.getLogger(AccountResource.class);

    private final UserRepository userRepository;

    private final UserService userService;

    private final MailService mailService;

    private final UserProfileRepository userProfileRepository;
    private final PlanRepository planRepository;
    private final ProgressLogRepository progressLogRepository;
    private final OtpRecordRepository otpRecordRepository;
    private final OtpService otpService;

    public AccountResource(
        UserRepository userRepository,
        UserService userService,
        MailService mailService,
        UserProfileRepository userProfileRepository,
        PlanRepository planRepository,
        ProgressLogRepository progressLogRepository,
        OtpRecordRepository otpRecordRepository,
        OtpService otpService
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.mailService = mailService;
        this.userProfileRepository = userProfileRepository;
        this.planRepository = planRepository;
        this.progressLogRepository = progressLogRepository;
        this.otpRecordRepository = otpRecordRepository;
        this.otpService = otpService;
    }

    /**
     * {@code POST  /register} : register the user.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void registerAccount(@Valid @RequestBody ManagedUserVM managedUserVM) {
        if (isPasswordLengthInvalid(managedUserVM.getPassword())) {
            throw new InvalidPasswordException();
        }
        // The login is the email address, and that address must have just been verified by OTP.
        String email = OtpService.normalizeEmail(managedUserVM.getEmail());
        if (!email.equals(OtpService.normalizeEmail(managedUserVM.getLogin()))) {
            throw new BadRequestAlertException("Login must be the email address", "userManagement", "loginnotemail");
        }
        if (!otpService.isTokenValid(email, Purpose.REGISTER_TOKEN, managedUserVM.getTempToken())) {
            throw new BadRequestAlertException("Email address has not been verified", "userManagement", "emailnotverified");
        }
        userService.registerUser(managedUserVM, managedUserVM.getPassword());
        otpService.consumeToken(email, Purpose.REGISTER_TOKEN, managedUserVM.getTempToken());
    }

    /**
     * {@code GET  /check-email/:email} : check if an email is already registered.
     * Returns 200 if available, 409 if already taken
     */
    @GetMapping("/check-email/{email}")
    public org.springframework.http.ResponseEntity<Void> checkEmailAvailable(@PathVariable String email) {
        if (userRepository.findOneByLogin(email.toLowerCase()).isPresent()) {
            return org.springframework.http.ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        return org.springframework.http.ResponseEntity.ok().build();
    }

    /**
     * {@code GET  /activate} : activate the registered user.
     */
    @GetMapping("/activate")
    public void activateAccount(@RequestParam(value = "key") String key) {
        Optional<User> user = userService.activateRegistration(key);
        if (!user.isPresent()) {
            throw new AccountResourceException("No user was found for this activation key");
        }
    }

    /**
     * {@code GET  /account} : get the current user.
     */
    @GetMapping("/account")
    public AdminUserDTO getAccount() {
        return userService
            .getUserWithAuthorities()
            .map(AdminUserDTO::new)
            .orElseThrow(() -> new AccountResourceException("User could not be found"));
    }

    /**
     * {@code POST  /account} : update the current user information.
     */
    @PostMapping("/account")
    public void saveAccount(@Valid @RequestBody AdminUserDTO userDTO) {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccountResourceException("Current user login not found"));
        Optional<User> existingUser = userRepository.findOneByEmailIgnoreCase(userDTO.getEmail());
        if (existingUser.isPresent() && (!existingUser.orElseThrow().getLogin().equalsIgnoreCase(userLogin))) {
            throw new EmailAlreadyUsedException();
        }
        Optional<User> user = userRepository.findOneByLogin(userLogin);
        if (!user.isPresent()) {
            throw new AccountResourceException("User could not be found");
        }
        userService.updateUser(
            userDTO.getFirstName(),
            userDTO.getLastName(),
            userDTO.getEmail(),
            userDTO.getLangKey(),
            userDTO.getImageUrl()
        );
    }

    /**
     * {@code POST  /account/change-password} : changes the current user's password.
     */
    @PostMapping(path = "/account/change-password")
    public void changePassword(@RequestBody PasswordChangeDTO passwordChangeDto) {
        if (isPasswordLengthInvalid(passwordChangeDto.getNewPassword())) {
            throw new InvalidPasswordException();
        }
        userService.changePassword(passwordChangeDto.getCurrentPassword(), passwordChangeDto.getNewPassword());
    }

    /**
     * {@code DELETE /account} : delete the current user's account and all associated data.
     * Deletion sequence：ProgressLog → Plan → UserProfile → OtpRecord → User
     */
    @DeleteMapping("/account")
    @Transactional
    public void deleteAccount() {
        String userLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new AccountResourceException("Current user login not found"));

        LOG.info("User {} requested account deletion", userLogin);

        userProfileRepository.findOneByUserLogin(userLogin).ifPresent(profile -> {
            Long profileId = profile.getId();
            progressLogRepository.deleteAllByProfileId(profileId);
            planRepository.deleteAllByProfileId(profileId);
            userProfileRepository.delete(profile);
        });

        userRepository.findOneByLogin(userLogin).ifPresent(user -> {
            if (user.getEmail() != null) {
                otpRecordRepository.deleteAllByEmail(user.getEmail());
            }
        });

        userService.deleteUser(userLogin);

        LOG.info("Account {} and all associated data deleted successfully", userLogin);
    }

    private static boolean isPasswordLengthInvalid(String password) {
        return (
            StringUtils.isEmpty(password) ||
            password.length() < ManagedUserVM.PASSWORD_MIN_LENGTH ||
            password.length() > ManagedUserVM.PASSWORD_MAX_LENGTH
        );
    }
}