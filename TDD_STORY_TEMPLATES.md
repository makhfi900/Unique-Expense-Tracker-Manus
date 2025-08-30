# TDD Story Templates - Ready-to-Use Definition of Done

## 📋 **QUICK REFERENCE STORY TEMPLATES**

### **🔧 Settings & Configuration Story Template**

```markdown
## Definition of Done - Settings Story

### Story: [Insert Story Title Here]
**Epic**: Settings & System Configuration
**Priority**: High (Admin functionality)
**Roles Affected**: Admin (primary), Manager (view-only)

#### 🔴 RED Phase - Test First Requirements
- [ ] **Admin Access Tests**: Write failing tests for admin-only setting access
- [ ] **Permission Boundary Tests**: Non-admin users receive 403 errors
- [ ] **Feature Toggle Tests**: Setting changes affect application behavior correctly
- [ ] **Configuration Persistence Tests**: Settings survive restarts and deployments
- [ ] **Schema Migration Tests**: New settings integrate with existing configuration

**Test Examples**:
```javascript
// Admin access validation
test('only admin users can modify system settings', async () => {
  const managerUser = { role: 'manager' };
  await expect(updateSettings(managerUser, newSettings))
    .rejects.toThrow('Unauthorized');
});

// Feature toggle functionality
test('enabling feature makes it available to appropriate roles', async () => {
  await updateFeatureFlag('expense_analytics', true);
  const accountOfficer = { role: 'account_officer' };
  expect(hasFeatureAccess(accountOfficer, 'expense_analytics')).toBe(true);
});

// Configuration persistence
test('settings persist after application restart', async () => {
  await updateSettings(adminUser, { theme: 'dark' });
  await simulateAppRestart();
  const currentSettings = await getSettings();
  expect(currentSettings.theme).toBe('dark');
});
```

#### 🟢 GREEN Phase - Implementation Requirements
- [ ] **Minimal Implementation**: Basic setting CRUD operations work
- [ ] **Admin UI Components**: Settings interface accessible to admin users only
- [ ] **Database Integration**: Settings stored and retrieved correctly
- [ ] **Validation Logic**: Setting values validated before save
- [ ] **Error Handling**: Graceful handling of invalid configurations

#### 🔵 REFACTOR Phase - Quality Requirements
- [ ] **Setting Categories**: Logical organization of configuration options
- [ ] **Validation Rules**: Comprehensive input validation and business rules
- [ ] **Audit Logging**: All setting changes logged with user and timestamp
- [ ] **Cache Management**: Setting changes invalidate relevant caches
- [ ] **Documentation**: Admin documentation updated with new settings

#### 📊 Specific Validation Requirements
- [ ] **Feature Matrix Testing**: Test all feature combinations across roles
- [ ] **Legacy Compatibility**: Existing users maintain access after changes
- [ ] **Performance Impact**: Setting changes don't degrade system performance
- [ ] **Security Review**: No sensitive data exposed in settings interface
- [ ] **Backup/Restore**: Settings included in system backup procedures

#### ✅ Acceptance Criteria Validation
- [ ] Admin can access all system configuration options
- [ ] Non-admin users cannot access settings (proper error messages)
- [ ] Setting changes take effect immediately without restart
- [ ] Invalid setting values are rejected with helpful error messages
- [ ] Audit trail shows who changed what and when
- [ ] Feature toggles correctly enable/disable functionality per role
```

---

### **👥 Role System Story Template**

```markdown
## Definition of Done - Role System Story

### Story: [Insert Story Title Here]
**Epic**: User Role Management
**Priority**: Critical (Security & Access Control)
**Roles Affected**: All 4 roles (admin, manager, teacher, account_officer)

#### 🔴 RED Phase - Test First Requirements
- [ ] **Role Hierarchy Tests**: Verify admin > manager > teacher > account_officer
- [ ] **Permission Boundary Tests**: Each role blocked from unauthorized features
- [ ] **Role Assignment Tests**: Users receive appropriate roles correctly
- [ ] **Role Change Tests**: Permission updates take effect immediately
- [ ] **Security Penetration Tests**: Role escalation attempts fail

**Test Examples**:
```javascript
// Role hierarchy enforcement
test('manager has all teacher permissions plus additional ones', () => {
  const teacherPermissions = getRolePermissions('teacher');
  const managerPermissions = getRolePermissions('manager');
  
  teacherPermissions.forEach(permission => {
    expect(managerPermissions).toContain(permission);
  });
  
  expect(managerPermissions.length).toBeGreaterThan(teacherPermissions.length);
});

// Permission boundary enforcement
test('account officer cannot access exam management', async () => {
  const accountOfficer = { role: 'account_officer' };
  await expect(accessExamManagement(accountOfficer))
    .rejects.toThrow('Insufficient permissions');
});

// Dynamic role updates
test('role changes take effect immediately', async () => {
  const user = await createUser({ role: 'account_officer' });
  expect(canAccessExams(user)).toBe(false);
  
  await updateUserRole(user.id, 'manager');
  const updatedUser = await getUser(user.id);
  expect(canAccessExams(updatedUser)).toBe(true);
});
```

#### 🟢 GREEN Phase - Implementation Requirements
- [ ] **Role Assignment Logic**: Users get correct default roles
- [ ] **Permission Checking**: Access control middleware works correctly
- [ ] **Role-Based UI**: Interface adapts to user role appropriately
- [ ] **API Security**: All endpoints respect role permissions
- [ ] **Error Messages**: Clear feedback for unauthorized access attempts

#### 🔵 REFACTOR Phase - Quality Requirements
- [ ] **Role Configuration**: Easy way to modify role permissions
- [ ] **Permission Caching**: Efficient permission lookups
- [ ] **Audit Trail**: All role changes logged for security review
- [ ] **Role Documentation**: Clear description of each role's capabilities
- [ ] **Migration Scripts**: Safe role updates for existing users

#### 📊 Specific Validation Requirements
- [ ] **Cross-App Permissions**: Roles work consistently across expense and exam modules
- [ ] **Data Isolation**: Users only see data appropriate to their role
- [ ] **Legacy User Migration**: Existing users assigned appropriate new roles
- [ ] **Performance Testing**: Permission checks don't slow down application
- [ ] **Security Audit**: No way to bypass role restrictions

#### ✅ Acceptance Criteria Validation
- [ ] Admin users have full system access including user management
- [ ] Manager users can access expenses and exams but not settings
- [ ] Teacher users only have access to exam management features
- [ ] Account Officer users only have access to expense management
- [ ] Role changes are immediate and don't require user logout
- [ ] Unauthorized access attempts are logged and blocked
- [ ] UI correctly hides/shows features based on user role
```

---

### **📝 Exam Management Story Template**

```markdown
## Definition of Done - Exam Management Story

### Story: [Insert Story Title Here]
**Epic**: Academic Exam System
**Priority**: High (Academic Core Functionality)
**Roles Affected**: Admin (full), Manager (view), Teacher (primary), Account Officer (none)

#### 🔴 RED Phase - Test First Requirements
- [ ] **Academic Workflow Tests**: Complete exam lifecycle testing
- [ ] **Teacher Access Tests**: Teachers only see their assigned classes
- [ ] **Deadline Enforcement Tests**: Time-based restrictions work correctly
- [ ] **Grading Logic Tests**: Score calculations and grade assignments
- [ ] **Academic Integrity Tests**: Anti-cheating measures function properly

**Test Examples**:
```javascript
// Complete academic workflow
test('complete exam workflow from creation to results', async () => {
  const teacher = { role: 'teacher', id: 'teacher1' };
  
  // Create exam
  const exam = await createExam(teacher, {
    title: 'Math Test',
    deadline: '2024-01-15T10:00:00Z',
    questions: mockQuestions
  });
  
  // Student takes exam
  const student = { id: 'student1' };
  await submitExamAnswers(student, exam.id, studentAnswers);
  
  // Teacher grades exam
  await gradeExam(teacher, exam.id, student.id, gradingRubric);
  
  // Results are available
  const results = await getExamResults(exam.id);
  expect(results).toHaveProperty('grades');
  expect(results.grades[student.id]).toBeDefined();
});

// Teacher access boundaries
test('teacher only accesses their assigned classes', async () => {
  const teacher1 = { role: 'teacher', id: 'teacher1' };
  const teacher2 = { role: 'teacher', id: 'teacher2' };
  
  const exam = await createExam(teacher1, examData);
  
  await expect(getExam(teacher2, exam.id))
    .rejects.toThrow('Not assigned to this class');
});

// Deadline enforcement
test('exam submissions rejected after deadline', async () => {
  const pastDeadlineExam = await createExam(teacher, {
    ...examData,
    deadline: '2020-01-01T10:00:00Z' // Past deadline
  });
  
  await expect(submitExamAnswers(student, pastDeadlineExam.id, answers))
    .rejects.toThrow('Submission deadline has passed');
});
```

#### 🟢 GREEN Phase - Implementation Requirements
- [ ] **Exam Creation**: Teachers can create exams with questions and deadlines
- [ ] **Class Assignment**: Exams automatically assigned to teacher's classes
- [ ] **Submission System**: Students can submit answers before deadline
- [ ] **Grading Interface**: Teachers can review and grade submissions
- [ ] **Results Display**: Appropriate results visibility by role

#### 🔵 REFACTOR Phase - Quality Requirements
- [ ] **Question Types**: Support multiple question formats (multiple choice, essay, etc.)
- [ ] **Automated Grading**: Automatic scoring for objective questions
- [ ] **Grade Analytics**: Performance statistics and trends
- [ ] **Export Functionality**: Grade reports and academic records
- [ ] **Notification Integration**: Alerts for deadlines and grade releases

#### 📊 Specific Validation Requirements
- [ ] **Academic Calendar Integration**: Exams respect school calendar and holidays
- [ ] **Grade Calculation Accuracy**: Mathematical correctness of scoring
- [ ] **Data Privacy**: Student grades only visible to appropriate users
- [ ] **Performance at Scale**: System handles many simultaneous exam submissions
- [ ] **Offline Capability**: Basic exam taking works without internet

#### ✅ Acceptance Criteria Validation
- [ ] Teachers can create comprehensive exams with various question types
- [ ] Students receive exams appropriate to their enrolled classes
- [ ] Deadline enforcement prevents late submissions automatically
- [ ] Grading system calculates scores accurately and consistently
- [ ] Academic integrity measures prevent cheating and copying
- [ ] Results are published to students only after teacher approval
- [ ] Administrators can view all academic data for reporting
```

---

### **🔔 Notification System Story Template**

```markdown
## Definition of Done - Notification Story

### Story: [Insert Story Title Here]
**Epic**: Communication & Alerts
**Priority**: Medium (User Experience Enhancement)
**Roles Affected**: All roles (different notification preferences)

#### 🔴 RED Phase - Test First Requirements
- [ ] **Multi-Channel Tests**: Email, SMS, in-app notifications work
- [ ] **Delivery Confirmation Tests**: Track notification receipt and read status
- [ ] **Failover Tests**: Backup methods activate when primary fails
- [ ] **Rate Limiting Tests**: Prevent notification spam and abuse
- [ ] **External API Tests**: Integration with email/SMS providers

**Test Examples**:
```javascript
// Multi-channel notification delivery
test('notification sends via email and appears in-app', async () => {
  const user = await createUser({ email: 'test@example.com' });
  const notification = {
    type: 'exam_deadline_reminder',
    message: 'Your exam deadline is tomorrow'
  };
  
  await sendNotification(user.id, notification);
  
  // Check email sent
  expect(mockEmailProvider.send).toHaveBeenCalledWith({
    to: 'test@example.com',
    subject: expect.stringContaining('Exam Deadline'),
    body: expect.stringContaining('tomorrow')
  });
  
  // Check in-app notification
  const inAppNotifications = await getInAppNotifications(user.id);
  expect(inAppNotifications).toContainEqual(
    expect.objectContaining({ message: notification.message })
  );
});

// Failover mechanism
test('SMS sent when email fails', async () => {
  const user = await createUser({ 
    email: 'test@example.com',
    phone: '+1234567890',
    notification_preferences: { email: true, sms: true }
  });
  
  // Simulate email failure
  mockEmailProvider.send.mockRejectedValue(new Error('SMTP Error'));
  
  await sendNotification(user.id, urgentNotification);
  
  // Verify SMS fallback
  expect(mockSMSProvider.send).toHaveBeenCalledWith({
    to: '+1234567890',
    message: expect.stringContaining(urgentNotification.message)
  });
});

// Rate limiting protection
test('rate limiting prevents notification spam', async () => {
  const user = await createUser();
  
  // Send many notifications quickly
  const promises = Array(100).fill().map(() => 
    sendNotification(user.id, { message: 'Test' })
  );
  
  await Promise.all(promises);
  
  // Should only send reasonable number
  expect(mockEmailProvider.send).toHaveBeenCalledTimes(10); // Rate limited
});
```

#### 🟢 GREEN Phase - Implementation Requirements
- [ ] **Notification Queue**: Reliable message queuing and delivery
- [ ] **Template System**: Consistent notification formatting
- [ ] **User Preferences**: Individual notification settings respected
- [ ] **External Integrations**: Email and SMS provider connections
- [ ] **Basic Analytics**: Delivery success/failure tracking

#### 🔵 REFACTOR Phase - Quality Requirements
- [ ] **Smart Scheduling**: Notifications sent at appropriate times
- [ ] **Personalization**: Messages customized to user context and role
- [ ] **Batch Processing**: Efficient bulk notification handling
- [ ] **Advanced Analytics**: Open rates, click-through rates, engagement metrics
- [ ] **A/B Testing**: Capability to test different notification strategies

#### 📊 Specific Validation Requirements
- [ ] **Cross-Timezone Support**: Notifications respect user time zones
- [ ] **Mobile Push Integration**: Push notifications on mobile devices
- [ ] **Compliance**: GDPR/CAN-SPAM compliance for marketing communications
- [ ] **Performance Impact**: Notification system doesn't slow down main application
- [ ] **Error Recovery**: Failed notifications retry with exponential backoff

#### ✅ Acceptance Criteria Validation
- [ ] Users receive notifications via their preferred channels
- [ ] Email notifications are properly formatted and deliverable
- [ ] SMS notifications work for urgent/time-sensitive alerts
- [ ] In-app notifications appear immediately and update in real-time
- [ ] Notification preferences can be customized by individual users
- [ ] Rate limiting prevents spam while allowing legitimate communications
- [ ] Delivery tracking provides visibility into notification success rates
```

---

### **🔗 Integration System Story Template**

```markdown
## Definition of Done - Integration Story

### Story: [Insert Story Title Here]
**Epic**: System Integration & Data Flow
**Priority**: High (System Architecture)
**Roles Affected**: All roles (transparent integration)

#### 🔴 RED Phase - Test First Requirements
- [ ] **Cross-App Communication Tests**: Data consistency between modules
- [ ] **State Synchronization Tests**: Real-time updates across components
- [ ] **API Contract Tests**: Integration endpoints validate correctly
- [ ] **Data Migration Tests**: Safe data transfer between systems
- [ ] **Rollback Integration Tests**: Graceful degradation when integration fails

**Test Examples**:
```javascript
// Cross-app data consistency
test('user profile changes sync across expense and exam modules', async () => {
  const user = await createUser({
    name: 'John Smith',
    role: 'teacher'
  });
  
  // Update user in expense module
  await updateUserProfile('expenses', user.id, { name: 'John M. Smith' });
  
  // Verify update appears in exam module
  const examModuleUser = await getUserProfile('exams', user.id);
  expect(examModuleUser.name).toBe('John M. Smith');
  
  // Verify update appears in settings
  const settingsUser = await getUserProfile('settings', user.id);
  expect(settingsUser.name).toBe('John M. Smith');
});

// Real-time synchronization
test('role changes propagate immediately across all modules', async () => {
  const user = await createUser({ role: 'account_officer' });
  
  // Set up real-time listeners
  const expenseListener = jest.fn();
  const examListener = jest.fn();
  
  subscribeToUserChanges('expenses', user.id, expenseListener);
  subscribeToUserChanges('exams', user.id, examListener);
  
  // Change role in settings
  await updateUserRole('settings', user.id, 'manager');
  
  // Verify real-time updates
  await waitFor(() => {
    expect(expenseListener).toHaveBeenCalledWith({
      userId: user.id,
      changes: { role: 'manager' }
    });
    expect(examListener).toHaveBeenCalledWith({
      userId: user.id,
      changes: { role: 'manager' }
    });
  });
});

// Integration rollback capability
test('integration can be safely disabled without data loss', async () => {
  // Create test data in both modules
  const expenseData = await createTestExpenses();
  const examData = await createTestExams();
  
  // Disable integration
  await disableIntegration('expense-exam-sync');
  
  // Verify both modules still function independently
  const expenses = await getExpenses();
  const exams = await getExams();
  
  expect(expenses).toHaveLength(expenseData.length);
  expect(exams).toHaveLength(examData.length);
  
  // Verify no data corruption
  expenses.forEach(expense => {
    expect(expense).toHaveProperty('id');
    expect(expense).toHaveProperty('amount');
  });
});
```

#### 🟢 GREEN Phase - Implementation Requirements
- [ ] **API Endpoints**: Integration APIs function correctly
- [ ] **Data Mapping**: Proper field mapping between integrated systems
- [ ] **Event Handlers**: System responds to integration events
- [ ] **Error Handling**: Graceful handling of integration failures
- [ ] **Basic Monitoring**: Integration health checks and status

#### 🔵 REFACTOR Phase - Quality Requirements
- [ ] **Event Sourcing**: Comprehensive audit trail of integration events
- [ ] **Conflict Resolution**: Smart handling of concurrent data changes
- [ ] **Caching Strategy**: Efficient caching for integration data
- [ ] **Performance Optimization**: Minimal impact on individual module performance
- [ ] **Advanced Monitoring**: Detailed metrics and alerting for integration health

#### 📊 Specific Validation Requirements
- [ ] **Data Integrity**: No data loss during integration operations
- [ ] **Performance Impact**: Integration doesn't slow down core functionality
- [ ] **Scalability**: Integration handles high volume data synchronization
- [ ] **Security**: Integration respects role-based access controls
- [ ] **Disaster Recovery**: Integration state can be restored from backups

#### ✅ Acceptance Criteria Validation
- [ ] User data remains consistent across expense and exam modules
- [ ] Role changes in one module immediately affect permissions in others
- [ ] Cross-module reports and analytics work correctly
- [ ] Integration can be temporarily disabled without system failure
- [ ] Data conflicts are resolved automatically with audit trail
- [ ] Performance remains acceptable even with integration active
- [ ] Security boundaries are maintained across module boundaries
```

---

## 🚀 **READY-TO-USE CHECKLIST TEMPLATES**

### **Quick Story Assessment Checklist**

```markdown
## Sprint Story Quick Check ✅

**Story Title**: _________________
**Story Type**: [ ] Settings [ ] Role System [ ] Exam Mgmt [ ] Notification [ ] Integration
**Estimated Complexity**: [ ] Low [ ] Medium [ ] High

### Pre-Development Check
- [ ] Story type template selected and customized
- [ ] Role-based testing requirements identified
- [ ] Performance benchmarks defined
- [ ] Security considerations documented
- [ ] Mobile requirements specified

### TDD Phase Check
- [ ] 🔴 RED: All tests written and failing
- [ ] 🟢 GREEN: Implementation passes all tests
- [ ] 🔵 REFACTOR: Code quality and optimization complete

### Quality Gate Check
- [ ] Test coverage > 80%
- [ ] Performance benchmarks met
- [ ] Security review complete
- [ ] Mobile functionality validated
- [ ] CI/CD pipeline passing

### Acceptance Ready
- [ ] All acceptance criteria validated
- [ ] Documentation updated
- [ ] Stakeholder approval received
- [ ] Deployment plan confirmed
```

### **Role-Based Testing Quick Reference**

```markdown
## 4-Role Testing Matrix

### Admin Role Testing
- [ ] Full system access validated
- [ ] User management capabilities confirmed
- [ ] System configuration access verified
- [ ] Override permissions working

### Manager Role Testing  
- [ ] Expenses + Exams access only
- [ ] No settings/user management access
- [ ] Organization-wide data visibility
- [ ] Reporting capabilities functional

### Teacher Role Testing
- [ ] Exams access only
- [ ] No expenses or settings access
- [ ] Class-limited data scope
- [ ] Grading capabilities working

### Account Officer Role Testing
- [ ] Expenses access only
- [ ] No exams or settings access
- [ ] Department-limited data scope
- [ ] Expense CRUD operations working
```

---

**🎯 Remember**: These templates are starting points. Customize them based on your specific story requirements, but ensure all TDD principles and quality gates are maintained.

**⚡ Status**: Ready-to-use TDD story templates available for immediate sprint planning!