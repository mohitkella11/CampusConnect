
package com.campusconnect.service;

import com.campusconnect.model.Issue;
import com.campusconnect.model.User;
import com.campusconnect.model.Department;
import com.campusconnect.model.IssueHistory;
import com.campusconnect.model.Notification;

import com.campusconnect.repository.IssueRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.repository.DepartmentRepository;
import com.campusconnect.repository.IssueHistoryRepository;
import com.campusconnect.repository.NotificationRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Objects;
import java.util.Map;

@Service
public class IssueService {

        private final IssueRepository issueRepository;
        private final UserRepository userRepository;
        private final DepartmentRepository departmentRepository;
        private final IssueHistoryRepository historyRepository;
        private final NotificationRepository notificationRepository;

        public IssueService(
                        IssueRepository issueRepository,
                        UserRepository userRepository,
                        DepartmentRepository departmentRepository,
                        IssueHistoryRepository historyRepository,
                        NotificationRepository notificationRepository) {

                this.issueRepository = issueRepository;
                this.userRepository = userRepository;
                this.departmentRepository = departmentRepository;
                this.historyRepository = historyRepository;
                this.notificationRepository = notificationRepository;
        }

        private boolean isAdmin(User user) {
                return user != null
                                && "ADMIN".equalsIgnoreCase(user.getRole());
        }

        private boolean isStudent(User user) {
                return user != null
                                && "STUDENT".equalsIgnoreCase(user.getRole());
        }

        private boolean isStaff(User user) {
                return user != null
                                && "STAFF".equalsIgnoreCase(user.getRole());
        }

        private void requireAdmin(User user) {
                if (!isAdmin(user)) {
                        throw new AccessDeniedException("Admin access required.");
                }
        }

        private void requireStudent(User user) {
                if (!isStudent(user)) {
                        throw new AccessDeniedException("Student access required.");
                }
        }

        /*
         * Access rules:
         * ADMIN: all issues
         * STAFF: all issues across departments
         * STUDENT: only their own issues
         */
        private void requireIssueAccess(Issue issue, User user) {

                boolean allowed = isAdmin(user)
                                || isStaff(user)
                                || (isStudent(user)
                                                && Objects.equals(
                                                                issue.getReportedBy(),
                                                                user.getId()));

                if (!allowed) {
                        throw new AccessDeniedException(
                                        "You are not allowed to access this issue.");
                }
        }

        private static final Map<String, String> CATEGORY_DEPARTMENT_MAP = Map.of(
                        "WIFI", "IT Support",
                        "PLUMBING", "Plumbing",
                        "ELECTRICAL", "Electrical",
                        "HOSTEL", "Hostel Maintenance",
                        "CLASSROOM", "Classroom Maintenance",
                        "CLEANLINESS", "Housekeeping",
                        "SECURITY", "Security",
                        "TRANSPORT", "Transport");

        private Department findDepartmentForCategory(String category) {

                if (category == null || category.isBlank()) {
                        return null;
                }

                String departmentName = CATEGORY_DEPARTMENT_MAP.get(
                                category.trim().toUpperCase());

                if (departmentName == null) {
                        return null;
                }

                return departmentRepository
                                .findByName(departmentName)
                                .orElse(null);
        }

        /*
         * Notify every Admin when a student creates an issue.
         */
        private void notifyAdmins(Issue issue) {

                List<User> admins = userRepository.findAll()
                                .stream()
                                .filter(this::isAdmin)
                                .toList();

                for (User admin : admins) {

                        notificationRepository.save(new Notification(
                                        admin.getId(),
                                        issue.getId(),
                                        "New issue reported: \""
                                                        + issue.getTitle()
                                                        + "\" by "
                                                        + issue.getReporterName()));
                }
        }

        @Transactional
        public Issue createIssue(Issue issue, User currentUser) {

                requireStudent(currentUser);

                issue.setReportedBy(currentUser.getId());
                issue.setReporterName(currentUser.getName());
                issue.setReporterEmail(currentUser.getEmail());

                issue.setStatus("PENDING");
                issue.setPriority("MEDIUM");
                issue.setAssignedTo(null);
                issue.setAssignedStaffName(null);

                Department department = findDepartmentForCategory(
                                issue.getCategory());

                issue.setDepartment(department);

                Issue savedIssue = issueRepository.save(issue);

                historyRepository.save(new IssueHistory(
                                savedIssue.getId(),
                                savedIssue.getStatus(),
                                "Issue reported"));

                if (department != null) {
                        historyRepository.save(new IssueHistory(
                                        savedIssue.getId(),
                                        savedIssue.getStatus(),
                                        "Automatically assigned to department: "
                                                        + department.getName()));
                }

                // NEW: notify all Admin accounts about the new issue.
                notifyAdmins(savedIssue);

                return savedIssue;
        }

        /*
         * ADMIN and STAFF see all issues.
         * STUDENT sees only their own issues.
         */
        public List<Issue> getAllIssues(User currentUser) {

                if (isAdmin(currentUser) || isStaff(currentUser)) {
                        return issueRepository
                                        .findAllByOrderByCreatedAtDesc();
                }

                if (isStudent(currentUser)) {
                        return issueRepository
                                        .findByReportedByOrderByCreatedAtDesc(
                                                        currentUser.getId());
                }

                throw new AccessDeniedException("Access denied.");
        }

        public List<Issue> getIssuesByUser(
                        Long userId,
                        User currentUser) {

                if (!isAdmin(currentUser)
                                && !(isStudent(currentUser)
                                                && Objects.equals(
                                                                userId,
                                                                currentUser.getId()))) {

                        throw new AccessDeniedException(
                                        "You can only view your own issues.");
                }

                return issueRepository
                                .findByReportedByOrderByCreatedAtDesc(userId);
        }

        public List<Issue> getAssignedIssues(
                        Long staffId,
                        User currentUser) {

                if (!isAdmin(currentUser)
                                && !(isStaff(currentUser)
                                                && Objects.equals(
                                                                staffId,
                                                                currentUser.getId()))) {

                        throw new AccessDeniedException(
                                        "You can only view issues assigned to you.");
                }

                return issueRepository
                                .findByAssignedToOrderByCreatedAtDesc(staffId);
        }

        public List<Issue> getDepartmentIssues(User currentUser) {

                if (!isStaff(currentUser)) {
                        throw new AccessDeniedException(
                                        "Staff access required.");
                }

                return issueRepository
                                .findAllByOrderByCreatedAtDesc();
        }

        public Optional<Issue> getIssueById(
                        Long id,
                        User currentUser) {

                Optional<Issue> optional = issueRepository.findById(id);

                optional.ifPresent(
                                issue -> requireIssueAccess(issue, currentUser));

                return optional;
        }

        @Transactional
        public Optional<Issue> updateIssue(
                        Long id,
                        Issue updatedIssue,
                        User currentUser) {

                requireStudent(currentUser);

                Optional<Issue> optional = issueRepository.findById(id);

                if (optional.isEmpty()) {
                        return Optional.empty();
                }

                Issue existing = optional.get();

                if (!Objects.equals(
                                existing.getReportedBy(),
                                currentUser.getId())
                                || !"PENDING".equalsIgnoreCase(
                                                existing.getStatus())) {

                        throw new AccessDeniedException(
                                        "You can only edit your own pending issues.");
                }

                existing.setTitle(updatedIssue.getTitle());
                existing.setDescription(updatedIssue.getDescription());
                existing.setCategory(updatedIssue.getCategory());
                existing.setLocation(updatedIssue.getLocation());

                existing.setDepartment(
                                findDepartmentForCategory(
                                                existing.getCategory()));

                return Optional.of(issueRepository.save(existing));
        }

        /*
         * ADMIN and STAFF can update status.
         * STUDENT cannot update status.
         */
        @Transactional
        public Optional<Issue> updateStatus(
                        Long id,
                        String status,
                        User currentUser) {

                Optional<Issue> optional = issueRepository.findById(id);

                if (optional.isEmpty()) {
                        return Optional.empty();
                }

                Issue issue = optional.get();

                if (!isAdmin(currentUser) && !isStaff(currentUser)) {
                        throw new AccessDeniedException(
                                        "Only staff or admin can update issue status.");
                }

                if (status == null || status.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Status is required.");
                }

                String newStatus = status.trim().toUpperCase();

                if (!List.of(
                                "PENDING",
                                "IN_PROGRESS",
                                "RESOLVED").contains(newStatus)) {

                        throw new IllegalArgumentException(
                                        "Invalid status.");
                }

                String oldStatus = issue.getStatus();

                if (newStatus.equalsIgnoreCase(oldStatus)) {
                        return Optional.of(issue);
                }

                issue.setStatus(newStatus);

                Issue saved = issueRepository.save(issue);

                historyRepository.save(new IssueHistory(
                                saved.getId(),
                                saved.getStatus(),
                                "Status changed from "
                                                + oldStatus
                                                + " to "
                                                + newStatus
                                                + " by "
                                                + currentUser.getName()));

                notificationRepository.save(new Notification(
                                saved.getReportedBy(),
                                saved.getId(),
                                "Your issue \""
                                                + saved.getTitle()
                                                + "\" status changed to "
                                                + newStatus));

                return Optional.of(saved);
        }

        @Transactional
        public Optional<Issue> updatePriority(
                        Long id,
                        String priority,
                        User currentUser) {

                requireAdmin(currentUser);

                Optional<Issue> optional = issueRepository.findById(id);

                if (optional.isEmpty()) {
                        return Optional.empty();
                }

                if (priority == null || priority.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Priority is required.");
                }

                String newPriority = priority.trim().toUpperCase();

                if (!List.of(
                                "LOW",
                                "MEDIUM",
                                "HIGH",
                                "URGENT").contains(newPriority)) {

                        throw new IllegalArgumentException(
                                        "Invalid priority.");
                }

                Issue issue = optional.get();
                issue.setPriority(newPriority);

                return Optional.of(issueRepository.save(issue));
        }

        @Transactional
        public Optional<Issue> assignIssue(
                        Long issueId,
                        Long staffId,
                        User currentUser) {

                requireAdmin(currentUser);

                Optional<Issue> issueOptional = issueRepository.findById(issueId);

                Optional<User> staffOptional = userRepository.findById(staffId);

                if (issueOptional.isEmpty()
                                || staffOptional.isEmpty()) {
                        return Optional.empty();
                }

                User staff = staffOptional.get();

                if (!isStaff(staff)) {
                        throw new IllegalArgumentException(
                                        "The selected user is not staff.");
                }

                Issue issue = issueOptional.get();

                issue.setAssignedTo(staff.getId());
                issue.setAssignedStaffName(staff.getName());

                issue.setDepartment(staff.getDepartment());

                Issue saved = issueRepository.save(issue);

                historyRepository.save(new IssueHistory(
                                saved.getId(),
                                saved.getStatus(),
                                "Assigned to staff: " + staff.getName()));

                notificationRepository.save(new Notification(
                                saved.getReportedBy(),
                                saved.getId(),
                                "Your issue \""
                                                + saved.getTitle()
                                                + "\" has been assigned to "
                                                + staff.getName()));

                return Optional.of(saved);
        }

        @Transactional
        public Optional<Issue> assignIssueToDepartment(
                        Long issueId,
                        Long departmentId,
                        User currentUser) {

                requireAdmin(currentUser);

                Optional<Issue> issueOptional = issueRepository.findById(issueId);

                Optional<Department> departmentOptional = departmentRepository.findById(departmentId);

                if (issueOptional.isEmpty()
                                || departmentOptional.isEmpty()) {
                        return Optional.empty();
                }

                Issue issue = issueOptional.get();
                Department department = departmentOptional.get();

                issue.setDepartment(department);

                Issue saved = issueRepository.save(issue);

                historyRepository.save(new IssueHistory(
                                saved.getId(),
                                saved.getStatus(),
                                "Assigned to department: "
                                                + department.getName()));

                return Optional.of(saved);
        }

        public List<IssueHistory> getIssueHistory(
                        Long issueId,
                        User currentUser) {

                Issue issue = issueRepository
                                .findById(issueId)
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Issue not found."));

                requireIssueAccess(issue, currentUser);

                return historyRepository
                                .findByIssueIdOrderByCreatedAtAsc(issueId);
        }

        public List<Notification> getNotifications(
                        Long userId,
                        User currentUser) {

                if (!isAdmin(currentUser)
                                && !Objects.equals(
                                                userId,
                                                currentUser.getId())) {

                        throw new AccessDeniedException(
                                        "You can only view your own notifications.");
                }

                return notificationRepository
                                .findByUserIdOrderByCreatedAtDesc(userId);
        }

        public long getUnreadNotificationCount(
                        Long userId,
                        User currentUser) {

                if (!isAdmin(currentUser)
                                && !Objects.equals(
                                                userId,
                                                currentUser.getId())) {

                        throw new AccessDeniedException(
                                        "You can only view your own notifications.");
                }

                return notificationRepository
                                .countByUserIdAndReadStatusFalse(userId);
        }

        @Transactional
        public Optional<Notification> markNotificationAsRead(
                        Long notificationId,
                        User currentUser) {

                Optional<Notification> optional = notificationRepository.findById(notificationId);

                if (optional.isEmpty()) {
                        return Optional.empty();
                }

                Notification notification = optional.get();

                if (!Objects.equals(
                                notification.getUserId(),
                                currentUser.getId())) {

                        throw new AccessDeniedException(
                                        "You can only mark your own notifications as read.");
                }

                notification.setReadStatus(true);

                return Optional.of(
                                notificationRepository.save(notification));
        }
}