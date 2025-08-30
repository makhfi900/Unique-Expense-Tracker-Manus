# Notification System Architecture
## WhatsApp/Email Integration for Exam Deadline Management

### Executive Summary

This document outlines the comprehensive notification system architecture for the enhanced educational institution management system, specifically focusing on exam result submission deadline tracking and teacher compliance monitoring. The system integrates WhatsApp as the primary notification method with email fallback, automated escalation workflows, and real-time compliance dashboards.

---

## 🎯 **System Requirements**

### Primary Objectives
1. **Automated Deadline Reminders**: Proactive notifications for test result submission deadlines
2. **Compliance Monitoring**: Real-time tracking of teacher submission status
3. **Escalation Management**: Automated escalation to managers and administrators for overdue submissions  
4. **Multi-Channel Communication**: WhatsApp primary, email fallback, in-system notifications
5. **Audit Trail**: Complete logging of all notifications and compliance activities

### Key Stakeholders
- **Exam Officers**: Primary system operators for deadline management and compliance tracking
- **Teachers**: Recipients of deadline reminders and compliance notifications  
- **Managers**: Recipients of departmental compliance reports and escalations
- **Administrators**: System-wide compliance oversight and configuration management

---

## 🏗️ **Architecture Overview**

### 1. System Components

```
Notification System Architecture
├── Notification Engine (Core)
│   ├── Deadline Scheduler
│   ├── Message Composer
│   ├── Multi-Channel Router
│   └── Retry & Escalation Manager
├── Communication Channels
│   ├── WhatsApp Business API
│   ├── Email Service (SMTP/SendGrid)
│   └── In-System Notifications
├── Compliance Monitor
│   ├── Real-time Status Tracker
│   ├── Metrics Calculator  
│   └── Dashboard Generator
├── Configuration Management
│   ├── Notification Templates
│   ├── Escalation Rules
│   └── Channel Preferences
└── Audit & Reporting
    ├── Notification Logs
    ├── Compliance Reports
    └── Performance Analytics
```

### 2. Data Flow Architecture

```typescript
interface NotificationFlow {
  trigger: DeadlineTrigger | ManualTrigger | EscalationTrigger;
  processing: MessageComposition | ChannelSelection | DeliveryAttempt;
  delivery: WhatsAppAPI | EmailSMTP | SystemNotification;
  tracking: DeliveryStatus | ReadReceipts | RetryAttempts;
  compliance: StatusUpdate | MetricsCalculation | ReportGeneration;
}
```

---

## 📱 **WhatsApp Integration Architecture**

### 1. WhatsApp Business API Implementation

```typescript
// src/services/notifications/WhatsAppService.ts
interface WhatsAppConfig {
  businessPhoneId: string;
  accessToken: string;
  webhookUrl: string;
  apiVersion: string;
}

interface WhatsAppMessage {
  recipient: string;
  type: 'text' | 'template' | 'interactive';
  content: {
    text?: string;
    templateName?: string;
    templateParams?: string[];
    buttons?: InteractiveButton[];
  };
  metadata: {
    examId: string;
    teacherId: string;
    notificationType: string;
    priority: 'low' | 'medium' | 'high';
  };
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private retryManager: RetryManager;
  
  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.retryManager = new RetryManager({
      maxRetries: 3,
      retryDelay: [1000, 5000, 15000] // Progressive delay
    });
  }

  async sendMessage(message: WhatsAppMessage): Promise<SendResult> {
    try {
      const payload = this.buildMessagePayload(message);
      
      const response = await fetch(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          messageId: result.messages[0].id,
          deliveredAt: new Date()
        };
      } else {
        throw new Error(`WhatsApp API Error: ${result.error.message}`);
      }
    } catch (error) {
      console.error('WhatsApp send failed:', error);
      return {
        success: false,
        error: error.message,
        shouldRetry: this.shouldRetryError(error)
      };
    }
  }

  private buildMessagePayload(message: WhatsAppMessage): any {
    const basePayload = {
      messaging_product: 'whatsapp',
      to: message.recipient,
      type: message.type
    };

    switch (message.type) {
      case 'text':
        return {
          ...basePayload,
          text: { body: message.content.text }
        };
      
      case 'template':
        return {
          ...basePayload,
          template: {
            name: message.content.templateName,
            language: { code: 'en' },
            components: message.content.templateParams ? [{
              type: 'body',
              parameters: message.content.templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }] : []
          }
        };
      
      case 'interactive':
        return {
          ...basePayload,
          interactive: {
            type: 'button',
            body: { text: message.content.text },
            action: {
              buttons: message.content.buttons?.map(btn => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title
                }
              }))
            }
          }
        };
      
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private shouldRetryError(error: any): boolean {
    // Retry on temporary failures, not on permanent ones
    const retryableErrors = [
      'network_error',
      'rate_limit_hit',
      'temporary_service_unavailable'
    ];
    
    return retryableErrors.some(code => 
      error.message.toLowerCase().includes(code)
    );
  }

  // Webhook handler for delivery status updates
  async handleWebhook(webhookData: any): Promise<void> {
    const { entry } = webhookData;
    
    for (const change of entry[0].changes) {
      if (change.field === 'messages') {
        const status = change.value.statuses?.[0];
        if (status) {
          await this.updateDeliveryStatus(
            status.id,
            status.status,
            status.timestamp
          );
        }
      }
    }
  }

  private async updateDeliveryStatus(
    messageId: string,
    status: string,
    timestamp: string
  ): Promise<void> {
    // Update notification record in database
    await NotificationService.updateDeliveryStatus(messageId, {
      status,
      deliveredAt: new Date(parseInt(timestamp) * 1000)
    });
  }
}
```

### 2. WhatsApp Message Templates

```typescript
// WhatsApp Business API approved message templates
export const WHATSAPP_TEMPLATES = {
  DEADLINE_REMINDER: {
    name: 'exam_deadline_reminder',
    content: `
      🎓 *Exam Result Submission Reminder*
      
      Dear {{teacher_name}},
      
      This is a reminder that the test results for *{{exam_name}}* are due on *{{deadline_date}}*.
      
      📋 Exam Details:
      • Subject: {{subject_name}}
      • Class: {{class_name}}  
      • Students: {{student_count}}
      
      ⏰ Time Remaining: {{time_remaining}}
      
      Please submit the results through the exam management system.
      
      Best regards,
      {{exam_officer_name}}
      Academic Office
    `,
    parameters: [
      'teacher_name', 'exam_name', 'deadline_date', 
      'subject_name', 'class_name', 'student_count',
      'time_remaining', 'exam_officer_name'
    ]
  },

  OVERDUE_ALERT: {
    name: 'exam_overdue_alert',
    content: `
      ⚠️ *URGENT: Overdue Test Results*
      
      Dear {{teacher_name}},
      
      The test results for *{{exam_name}}* were due on {{deadline_date}} and are now {{days_overdue}} days overdue.
      
      📋 Exam Details:
      • Subject: {{subject_name}}
      • Class: {{class_name}}
      • Original Due Date: {{deadline_date}}
      
      🚨 This matter has been escalated to {{manager_name}}.
      
      Please submit the results immediately or contact the academic office.
      
      Academic Office
      {{institution_name}}
    `,
    parameters: [
      'teacher_name', 'exam_name', 'deadline_date',
      'days_overdue', 'subject_name', 'class_name',
      'manager_name', 'institution_name'
    ]
  },

  ESCALATION_NOTICE: {
    name: 'manager_escalation',
    content: `
      📊 *Department Compliance Alert*
      
      Dear {{manager_name}},
      
      {{teacher_name}} has not submitted results for *{{exam_name}}* which were due {{days_overdue}} days ago.
      
      📋 Details:
      • Subject: {{subject_name}}
      • Class: {{class_name}}
      • Teacher: {{teacher_name}}
      • Due Date: {{deadline_date}}
      • Reminders Sent: {{reminder_count}}
      
      Please follow up with the teacher or contact the academic office.
      
      Academic Office
      {{institution_name}}
    `,
    parameters: [
      'manager_name', 'teacher_name', 'exam_name',
      'days_overdue', 'subject_name', 'class_name',
      'deadline_date', 'reminder_count', 'institution_name'
    ]
  }
};
```

---

## 📧 **Email Integration Architecture**

### 1. Email Service Implementation

```typescript
// src/services/notifications/EmailService.ts
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  fallbackProvider?: 'sendgrid' | 'ses' | 'mailgun';
}

interface EmailMessage {
  recipient: {
    email: string;
    name: string;
  };
  subject: string;
  htmlContent: string;
  textContent: string;
  attachments?: EmailAttachment[];
  priority: 'low' | 'normal' | 'high';
  metadata: {
    examId: string;
    teacherId: string;
    notificationType: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: EmailTemplateManager;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransporter({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.username,
        pass: config.password
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    this.templates = new EmailTemplateManager();
  }

  async sendNotification(message: EmailMessage): Promise<SendResult> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromAddress}>`,
        to: `"${message.recipient.name}" <${message.recipient.email}>`,
        subject: message.subject,
        html: message.htmlContent,
        text: message.textContent,
        priority: message.priority,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        deliveredAt: new Date()
      };
    } catch (error) {
      console.error('Email send failed:', error);
      
      // Try fallback provider if configured
      if (this.config.fallbackProvider) {
        return await this.sendViaFallback(message);
      }

      return {
        success: false,
        error: error.message,
        shouldRetry: this.shouldRetryError(error)
      };
    }
  }

  private async sendViaFallback(message: EmailMessage): Promise<SendResult> {
    // Implementation for fallback email provider
    // e.g., SendGrid, AWS SES, Mailgun
    switch (this.config.fallbackProvider) {
      case 'sendgrid':
        return await this.sendViaSendGrid(message);
      case 'ses':
        return await this.sendViaSES(message);
      case 'mailgun':
        return await this.sendViaMailgun(message);
      default:
        throw new Error('No fallback provider configured');
    }
  }

  private shouldRetryError(error: any): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED', 
      'ETIMEDOUT',
      'ENOTFOUND'
    ];
    
    return retryableErrors.some(code => 
      error.code === code || error.message.includes(code)
    );
  }
}
```

### 2. Email Templates

```html
<!-- Deadline Reminder Email Template -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exam Result Submission Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .exam-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
        .deadline { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Exam Result Submission Reminder</h1>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{teacher_name}}</strong>,</p>
            
            <p>This is a friendly reminder that the test results for <strong>{{exam_name}}</strong> are due soon.</p>
            
            <div class="exam-details">
                <h3>📋 Exam Details</h3>
                <ul>
                    <li><strong>Subject:</strong> {{subject_name}}</li>
                    <li><strong>Class:</strong> {{class_name}}</li>
                    <li><strong>Number of Students:</strong> {{student_count}}</li>
                    <li><strong>Exam Date:</strong> {{exam_date}}</li>
                </ul>
            </div>
            
            <div class="deadline">
                <h3>⏰ Important Deadline Information</h3>
                <p><strong>Submission Deadline:</strong> {{deadline_date}} at {{deadline_time}}</p>
                <p><strong>Time Remaining:</strong> {{time_remaining}}</p>
            </div>
            
            <p>Please log into the exam management system to submit the results. If you need any assistance or have questions, please don't hesitate to contact the academic office.</p>
            
            <a href="{{submission_link}}" class="cta-button">Submit Results Now</a>
            
            <p>Best regards,<br>
            <strong>{{exam_officer_name}}</strong><br>
            Academic Office<br>
            {{institution_name}}</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the Exam Management System.</p>
            <p>If you believe you received this email in error, please contact the academic office.</p>
        </div>
    </div>
</body>
</html>
```

---

## 🔔 **Notification Engine Core**

### 1. Central Notification Service

```typescript
// src/services/notifications/NotificationEngine.ts
interface NotificationRule {
  id: string;
  name: string;
  trigger: {
    type: 'deadline' | 'overdue' | 'escalation';
    conditions: {
      daysBeforeDeadline?: number;
      daysAfterDeadline?: number;
      reminderCount?: number;
    };
  };
  recipients: {
    primary: string[]; // Role types
    escalation?: string[];
  };
  channels: {
    primary: 'whatsapp' | 'email' | 'system';
    fallback: ('whatsapp' | 'email' | 'system')[];
  };
  template: string;
  retryConfig: {
    maxAttempts: number;
    retryDelay: number[];
  };
  active: boolean;
}

class NotificationEngine {
  private whatsAppService: WhatsAppService;
  private emailService: EmailService;
  private systemNotificationService: SystemNotificationService;
  private ruleEngine: NotificationRuleEngine;
  private scheduler: NotificationScheduler;

  constructor() {
    this.whatsAppService = new WhatsAppService(whatsAppConfig);
    this.emailService = new EmailService(emailConfig);
    this.systemNotificationService = new SystemNotificationService();
    this.ruleEngine = new NotificationRuleEngine();
    this.scheduler = new NotificationScheduler();
  }

  async processNotifications(): Promise<void> {
    try {
      // Get all pending notifications
      const pendingNotifications = await this.getPendingNotifications();
      
      for (const notification of pendingNotifications) {
        await this.processNotification(notification);
      }
      
      // Process escalations
      await this.processEscalations();
      
      // Update compliance metrics
      await this.updateComplianceMetrics();
      
    } catch (error) {
      console.error('Notification processing failed:', error);
      await this.logError(error);
    }
  }

  private async processNotification(notification: PendingNotification): Promise<void> {
    const rule = await this.ruleEngine.getRule(notification.ruleId);
    if (!rule || !rule.active) return;

    const recipients = await this.resolveRecipients(notification, rule);
    
    for (const recipient of recipients) {
      const message = await this.composeMessage(notification, recipient, rule);
      
      // Try primary channel first
      let result = await this.sendViaChannel(message, rule.channels.primary);
      
      // Try fallback channels if primary fails
      if (!result.success && rule.channels.fallback.length > 0) {
        for (const fallbackChannel of rule.channels.fallback) {
          result = await this.sendViaChannel(message, fallbackChannel);
          if (result.success) break;
        }
      }
      
      // Log notification attempt
      await this.logNotificationAttempt(notification, recipient, result);
      
      // Schedule retry if needed
      if (!result.success && result.shouldRetry) {
        await this.scheduleRetry(notification, recipient, rule);
      }
    }
  }

  private async sendViaChannel(
    message: NotificationMessage,
    channel: string
  ): Promise<SendResult> {
    switch (channel) {
      case 'whatsapp':
        return await this.whatsAppService.sendMessage(message.whatsapp);
      case 'email':
        return await this.emailService.sendNotification(message.email);
      case 'system':
        return await this.systemNotificationService.create(message.system);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private async processEscalations(): Promise<void> {
    // Find overdue submissions that need escalation
    const overdueSubmissions = await this.getOverdueSubmissions();
    
    for (const submission of overdueSubmissions) {
      if (this.shouldEscalate(submission)) {
        await this.createEscalationNotification(submission);
      }
    }
  }

  private shouldEscalate(submission: OverdueSubmission): boolean {
    const escalationRules = {
      firstEscalation: 2, // days overdue
      secondEscalation: 5,
      finalEscalation: 10
    };

    return submission.daysOverdue >= escalationRules.firstEscalation &&
           !submission.escalated;
  }

  private async updateComplianceMetrics(): Promise<void> {
    // Calculate real-time compliance metrics for dashboards
    const departments = await this.getDepartments();
    
    for (const department of departments) {
      const metrics = await this.calculateComplianceMetrics(department.id);
      await this.updateDashboardMetrics(department.id, metrics);
    }
  }
}
```

### 2. Notification Scheduler

```typescript
// src/services/notifications/NotificationScheduler.ts
class NotificationScheduler {
  private cronJobs: Map<string, CronJob> = new Map();

  start(): void {
    // Daily deadline check at 9 AM
    this.scheduleJob('daily-deadline-check', '0 9 * * *', async () => {
      await this.checkUpcomingDeadlines();
    });

    // Overdue check every 4 hours  
    this.scheduleJob('overdue-check', '0 */4 * * *', async () => {
      await this.checkOverdueSubmissions();
    });

    // Escalation check daily at 10 AM
    this.scheduleJob('escalation-check', '0 10 * * *', async () => {
      await this.processEscalations();
    });

    // Compliance metrics update every hour
    this.scheduleJob('metrics-update', '0 * * * *', async () => {
      await this.updateComplianceMetrics();
    });
  }

  private scheduleJob(name: string, pattern: string, task: () => Promise<void>): void {
    const job = new CronJob(pattern, task, null, true, 'UTC');
    this.cronJobs.set(name, job);
    console.log(`Scheduled job: ${name} with pattern: ${pattern}`);
  }

  private async checkUpcomingDeadlines(): Promise<void> {
    // Find exams with deadlines in next 1, 3, and 7 days
    const upcomingDeadlines = await ExamService.getUpcomingDeadlines([1, 3, 7]);
    
    for (const exam of upcomingDeadlines) {
      if (!exam.resultSubmitted) {
        await this.createDeadlineReminder(exam);
      }
    }
  }

  private async checkOverdueSubmissions(): Promise<void> {
    const overdueSubmissions = await ExamService.getOverdueSubmissions();
    
    for (const submission of overdueSubmissions) {
      await this.createOverdueAlert(submission);
    }
  }

  stop(): void {
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs.clear();
  }
}
```

---

## 📊 **Compliance Monitoring Dashboard**

### 1. Real-time Compliance Tracking

```typescript
// src/services/compliance/ComplianceMonitor.ts
interface ComplianceMetrics {
  department: {
    id: string;
    name: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    totalExams: number;
    submittedOnTime: number;
    submittedLate: number;
    overdue: number;
    complianceRate: number;
    averageDelayDays: number;
  };
  teachers: {
    id: string;
    name: string;
    complianceScore: number;
    totalExams: number;
    onTimeSubmissions: number;
  }[];
  trends: {
    dailyCompliance: { date: Date; rate: number }[];
    weeklyTrend: 'improving' | 'stable' | 'declining';
  };
}

class ComplianceMonitor {
  async getDepartmentCompliance(
    departmentId: string,
    period: DateRange
  ): Promise<ComplianceMetrics> {
    const exams = await this.getExamsForPeriod(departmentId, period);
    const submissions = await this.getSubmissionsForExams(exams.map(e => e.id));
    
    const metrics = this.calculateMetrics(exams, submissions);
    const teacherScores = await this.calculateTeacherScores(departmentId, period);
    const trends = await this.calculateTrends(departmentId, period);

    return {
      department: await this.getDepartmentInfo(departmentId),
      period,
      metrics,
      teachers: teacherScores,
      trends
    };
  }

  private calculateMetrics(
    exams: Exam[],
    submissions: ResultSubmission[]
  ): ComplianceMetrics['metrics'] {
    const totalExams = exams.length;
    const submittedOnTime = submissions.filter(s => 
      s.submissionDate <= s.deadlineDate
    ).length;
    const submittedLate = submissions.filter(s => 
      s.submissionDate > s.deadlineDate
    ).length;
    const overdue = totalExams - submissions.length;
    
    const complianceRate = totalExams > 0 ? 
      (submittedOnTime / totalExams) * 100 : 0;
    
    const averageDelayDays = this.calculateAverageDelay(submissions);

    return {
      totalExams,
      submittedOnTime,
      submittedLate,
      overdue,
      complianceRate: Math.round(complianceRate * 100) / 100,
      averageDelayDays: Math.round(averageDelayDays * 100) / 100
    };
  }

  async generateComplianceReport(
    departmentId: string,
    period: DateRange
  ): Promise<ComplianceReport> {
    const metrics = await this.getDepartmentCompliance(departmentId, period);
    
    return {
      ...metrics,
      recommendations: this.generateRecommendations(metrics),
      actionItems: this.generateActionItems(metrics),
      generatedAt: new Date(),
      generatedBy: 'system'
    };
  }

  private generateRecommendations(metrics: ComplianceMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.metrics.complianceRate < 80) {
      recommendations.push(
        'Consider implementing additional reminder notifications'
      );
      recommendations.push(
        'Review exam scheduling to ensure realistic submission deadlines'
      );
    }
    
    if (metrics.metrics.averageDelayDays > 3) {
      recommendations.push(
        'Investigate common causes of submission delays with affected teachers'
      );
    }
    
    // Identify teachers needing support
    const strugglingTeachers = metrics.teachers.filter(t => 
      t.complianceScore < 70
    );
    
    if (strugglingTeachers.length > 0) {
      recommendations.push(
        `Provide additional training or support for ${strugglingTeachers.length} teachers with low compliance scores`
      );
    }

    return recommendations;
  }
}
```

### 2. Compliance Dashboard Components

```typescript
// src/components/compliance/ComplianceDashboard.tsx
interface ComplianceDashboardProps {
  departmentId?: string;
  dateRange: DateRange;
  userRole: 'administrator' | 'manager' | 'exam_officer';
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  departmentId,
  dateRange,
  userRole
}) => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await ComplianceService.getMetrics(departmentId, dateRange);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch compliance metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    
    // Set up real-time updates
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [departmentId, dateRange]);

  if (loading || !metrics) {
    return <ComplianceDashboardSkeleton />;
  }

  return (
    <div className="compliance-dashboard">
      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Overall Compliance Rate"
          value={`${metrics.metrics.complianceRate}%`}
          trend={metrics.trends.weeklyTrend}
          color={getComplianceColor(metrics.metrics.complianceRate)}
        />
        <MetricCard
          title="On-Time Submissions"
          value={metrics.metrics.submittedOnTime}
          subtitle={`of ${metrics.metrics.totalExams} total`}
          color="green"
        />
        <MetricCard
          title="Overdue Submissions"
          value={metrics.metrics.overdue}
          subtitle="Require immediate attention"
          color="red"
        />
        <MetricCard
          title="Average Delay"
          value={`${metrics.metrics.averageDelayDays} days`}
          subtitle="For late submissions"
          color="orange"
        />
      </div>

      {/* Compliance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceTrendChart data={metrics.trends.dailyCompliance} />
        </CardContent>
      </Card>

      {/* Teacher Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Compliance Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherComplianceTable 
            teachers={metrics.teachers}
            onTeacherSelect={handleTeacherSelect}
          />
        </CardContent>
      </Card>

      {/* Action Items */}
      {userRole === 'exam_officer' && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionItemsList 
              recommendations={metrics.recommendations}
              onActionTaken={handleActionTaken}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

---

## 🔧 **Configuration Management**

### 1. Notification Configuration

```typescript
// src/config/NotificationConfig.ts
interface NotificationConfig {
  channels: {
    whatsapp: {
      enabled: boolean;
      priority: number;
      businessPhoneId: string;
      accessToken: string;
      webhookUrl: string;
      rateLimits: {
        messagesPerMinute: number;
        messagesPerHour: number;
      };
    };
    email: {
      enabled: boolean;
      priority: number;
      smtp: {
        host: string;
        port: number;
        username: string;
        password: string;
      };
      fallbackProvider?: string;
      rateLimits: {
        messagesPerMinute: number;
        messagesPerHour: number;
      };
    };
    system: {
      enabled: boolean;
      priority: number;
    };
  };
  
  rules: {
    deadlineReminders: {
      enabled: boolean;
      triggers: number[]; // Days before deadline [7, 3, 1]
      channels: string[];
      retryAttempts: number;
    };
    overdueAlerts: {
      enabled: boolean;
      triggers: number[]; // Days after deadline [1, 3, 7]
      channels: string[];
      escalationThreshold: number;
    };
    escalations: {
      enabled: boolean;
      levels: {
        manager: { daysOverdue: number; channels: string[] };
        administrator: { daysOverdue: number; channels: string[] };
      };
    };
  };
  
  templates: {
    whatsapp: Record<string, WhatsAppTemplate>;
    email: Record<string, EmailTemplate>;
    system: Record<string, SystemTemplate>;
  };
  
  compliance: {
    updateInterval: number; // minutes
    reportGeneration: {
      daily: boolean;
      weekly: boolean;
      monthly: boolean;
    };
  };
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  channels: {
    whatsapp: {
      enabled: true,
      priority: 1,
      businessPhoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
      rateLimits: {
        messagesPerMinute: 80,
        messagesPerHour: 1000
      }
    },
    email: {
      enabled: true,
      priority: 2,
      smtp: {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || '587'),
        username: process.env.SMTP_USERNAME!,
        password: process.env.SMTP_PASSWORD!
      },
      rateLimits: {
        messagesPerMinute: 100,
        messagesPerHour: 2000
      }
    },
    system: {
      enabled: true,
      priority: 3
    }
  },
  
  rules: {
    deadlineReminders: {
      enabled: true,
      triggers: [7, 3, 1], // 7, 3, and 1 days before deadline
      channels: ['whatsapp', 'email'],
      retryAttempts: 3
    },
    overdueAlerts: {
      enabled: true,
      triggers: [1, 3, 7], // 1, 3, and 7 days after deadline
      channels: ['whatsapp', 'email', 'system'],
      escalationThreshold: 2 // Escalate after 2 days overdue
    },
    escalations: {
      enabled: true,
      levels: {
        manager: { 
          daysOverdue: 2, 
          channels: ['whatsapp', 'email'] 
        },
        administrator: { 
          daysOverdue: 7, 
          channels: ['whatsapp', 'email', 'system'] 
        }
      }
    }
  },
  
  templates: {
    whatsapp: WHATSAPP_TEMPLATES,
    email: EMAIL_TEMPLATES,
    system: SYSTEM_TEMPLATES
  },
  
  compliance: {
    updateInterval: 15, // Update metrics every 15 minutes
    reportGeneration: {
      daily: true,
      weekly: true,
      monthly: true
    }
  }
};
```

---

## 🔐 **Security and Privacy**

### 1. Data Protection

```typescript
// src/services/security/NotificationSecurity.ts
class NotificationSecurity {
  // Encrypt sensitive notification data
  static encryptNotificationData(data: any): string {
    const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY!);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Anonymize personal data in logs
  static anonymizeLogData(data: any): any {
    return {
      ...data,
      phone: data.phone ? `***${data.phone.slice(-4)}` : undefined,
      email: data.email ? `***@${data.email.split('@')[1]}` : undefined,
      name: data.name ? `${data.name.charAt(0)}***` : undefined
    };
  }

  // Validate notification permissions
  static async validateNotificationPermission(
    senderId: string,
    recipientId: string,
    notificationType: string
  ): Promise<boolean> {
    const sender = await UserService.getUser(senderId);
    const recipient = await UserService.getUser(recipientId);
    
    // Only exam officers, managers, and administrators can send exam notifications
    const authorizedRoles = ['administrator', 'manager', 'exam_officer'];
    
    return authorizedRoles.includes(sender.role) &&
           this.isValidRecipient(recipient, notificationType);
  }

  private static isValidRecipient(recipient: User, type: string): boolean {
    switch (type) {
      case 'deadline_reminder':
        return recipient.role === 'teacher';
      case 'escalation':
        return ['manager', 'administrator'].includes(recipient.role);
      default:
        return true;
    }
  }
}
```

### 2. Rate Limiting and Abuse Prevention

```typescript
// src/middleware/NotificationRateLimiter.ts
class NotificationRateLimiter {
  private redis: Redis;
  private limits: Record<string, { count: number; window: number }>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.limits = {
      whatsapp: { count: 80, window: 60 }, // 80 per minute
      email: { count: 100, window: 60 }, // 100 per minute
      user: { count: 10, window: 60 } // 10 per user per minute
    };
  }

  async checkLimit(
    type: string,
    identifier: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const limit = this.limits[type];
    if (!limit) return { allowed: true, remaining: -1, resetTime: 0 };

    const key = `rate_limit:${type}:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, limit.window);
    }

    const ttl = await this.redis.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);

    return {
      allowed: current <= limit.count,
      remaining: Math.max(0, limit.count - current),
      resetTime
    };
  }

  async blockSuspiciousActivity(identifier: string, duration: number): Promise<void> {
    const blockKey = `blocked:${identifier}`;
    await this.redis.setex(blockKey, duration, '1');
  }
}
```

---

## 📈 **Performance and Monitoring**

### 1. Performance Metrics

```typescript
// src/monitoring/NotificationMonitoring.ts
interface NotificationMetrics {
  delivery: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  channels: {
    whatsapp: ChannelMetrics;
    email: ChannelMetrics;
    system: ChannelMetrics;
  };
  performance: {
    averageDeliveryTime: number;
    averageRetryCount: number;
    rateLimitHits: number;
  };
  compliance: {
    reminderEffectiveness: number;
    escalationRate: number;
    complianceImprovement: number;
  };
}

interface ChannelMetrics {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageDeliveryTime: number;
}

class NotificationMonitoring {
  async collectMetrics(period: DateRange): Promise<NotificationMetrics> {
    const notifications = await this.getNotifications(period);
    
    return {
      delivery: this.calculateDeliveryMetrics(notifications),
      channels: this.calculateChannelMetrics(notifications),
      performance: this.calculatePerformanceMetrics(notifications),
      compliance: await this.calculateComplianceMetrics(period)
    };
  }

  async generatePerformanceReport(): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics({
      startDate: subDays(new Date(), 30),
      endDate: new Date()
    });

    return {
      summary: this.generateSummary(metrics),
      trends: await this.analyzeTrends(metrics),
      recommendations: this.generateRecommendations(metrics),
      alerts: this.checkForAlerts(metrics)
    };
  }

  private generateRecommendations(metrics: NotificationMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.delivery.successRate < 95) {
      recommendations.push('Investigate notification delivery failures');
    }

    if (metrics.performance.averageRetryCount > 2) {
      recommendations.push('Review retry configuration and channel reliability');
    }

    if (metrics.channels.whatsapp.deliveryRate < 90) {
      recommendations.push('Check WhatsApp Business API configuration');
    }

    return recommendations;
  }
}
```

---

## 🚀 **Deployment and Integration**

### 1. Environment Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  notification-service:
    build: ./notification-service
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - WHATSAPP_BUSINESS_PHONE_ID=${WHATSAPP_BUSINESS_PHONE_ID}
      - WHATSAPP_ACCESS_TOKEN=${WHATSAPP_ACCESS_TOKEN}
      - WHATSAPP_WEBHOOK_URL=${WHATSAPP_WEBHOOK_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
    depends_on:
      - redis
      - postgres
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

### 2. Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-2)
- [ ] Database schema implementation
- [ ] Basic notification service setup
- [ ] WhatsApp Business API integration
- [ ] Email service implementation

#### Phase 2: Core Features (Weeks 3-4)
- [ ] Notification engine with rule processing
- [ ] Deadline tracking and reminder system
- [ ] Escalation workflow implementation
- [ ] Basic compliance monitoring

#### Phase 3: Advanced Features (Weeks 5-6)  
- [ ] Comprehensive dashboard implementation
- [ ] Advanced compliance metrics and reporting
- [ ] Rate limiting and security measures
- [ ] Performance monitoring and alerts

#### Phase 4: Integration & Testing (Weeks 7-8)
- [ ] Integration with existing exam management system
- [ ] Comprehensive testing and validation
- [ ] User training and documentation
- [ ] Production deployment and monitoring

---

## 📋 **Conclusion**

This notification system architecture provides a comprehensive solution for exam deadline management and teacher compliance tracking. Key benefits include:

1. **Automated Compliance**: Proactive deadline reminders and escalation workflows
2. **Multi-Channel Reliability**: WhatsApp primary with email fallback ensures message delivery
3. **Real-time Monitoring**: Live compliance dashboards for immediate visibility
4. **Scalable Architecture**: Designed to handle growth in users and notifications
5. **Security-First**: Built-in data protection and privacy measures
6. **Integration-Ready**: Seamless integration with existing exam management system

The system significantly reduces manual oversight burden on exam officers while ensuring academic deadlines are met consistently across the institution.