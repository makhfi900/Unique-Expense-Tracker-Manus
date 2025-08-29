import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigation } from '../context/NavigationContext';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  GraduationCap,
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
  Construction
} from 'lucide-react';

const ExamManagement = () => {
  const { addBreadcrumb, removeBreadcrumb } = useNavigation();
  const { hasFeatureAccess, getRoleDisplay, currentRole } = useRoleBasedAccess();
  const [activeSection, setActiveSection] = useState('overview');

  const roleDisplay = getRoleDisplay();

  // Check feature access
  const canViewExams = hasFeatureAccess('exams', 'view_exams');
  const canCreateExams = hasFeatureAccess('exams', 'create_exam');
  const canGradeExams = hasFeatureAccess('exams', 'grade_exam');
  const canViewResults = hasFeatureAccess('exams', 'view_results');
  const canGenerateReports = hasFeatureAccess('exams', 'generate_reports');
  const canManageStudents = hasFeatureAccess('exams', 'student_management');

  // Mock data for demonstration
  const mockExams = [
    {
      id: 1,
      title: 'Mathematics - Final Exam',
      subject: 'Mathematics',
      class: 'Grade 12',
      date: '2024-09-15',
      status: 'upcoming',
      duration: 120,
      totalQuestions: 50,
      studentsEnrolled: 45
    },
    {
      id: 2,
      title: 'Physics - Midterm',
      subject: 'Physics',
      class: 'Grade 11',
      date: '2024-09-10',
      status: 'completed',
      duration: 90,
      totalQuestions: 40,
      studentsEnrolled: 38
    },
    {
      id: 3,
      title: 'Chemistry - Quiz',
      subject: 'Chemistry',
      class: 'Grade 10',
      date: '2024-09-20',
      status: 'draft',
      duration: 60,
      totalQuestions: 25,
      studentsEnrolled: 0
    }
  ];

  const mockStats = {
    totalExams: 156,
    activeExams: 12,
    completedExams: 134,
    totalStudents: 850,
    averageScore: 78.5,
    passRate: 85.2
  };

  const handleSectionChange = (section, sectionTitle) => {
    setActiveSection(section);
    if (section !== 'overview') {
      addBreadcrumb(sectionTitle, `/exams/${section}`);
    } else {
      removeBreadcrumb(1);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      active: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || colors.draft;
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${color}-500/10 to-transparent rounded-full -translate-y-16 translate-x-16`}></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-800 dark:from-white dark:to-green-200 bg-clip-text text-transparent">
                  Exam Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Handle examinations, results, and academic records
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={roleDisplay.badgeVariant} className="font-medium">
                {roleDisplay.label}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
            <Construction className="h-4 w-4" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Under Development
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              The Exam Management system is currently under active development. 
              This preview shows the planned interface and features that will be available soon.
            </AlertDescription>
          </Alert>
        </motion.div>

        <Tabs value={activeSection} onValueChange={(value) => handleSectionChange(value, value)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" disabled={!canViewExams}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="exams" disabled={!canViewExams}>
              <FileText className="h-4 w-4 mr-2" />
              Exams
            </TabsTrigger>
            <TabsTrigger value="create" disabled={!canCreateExams}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="grading" disabled={!canGradeExams}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Grading
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!canViewResults}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="students" disabled={!canManageStudents}>
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <StatCard
                title="Total Exams"
                value={mockStats.totalExams}
                subtitle="All time"
                icon={FileText}
                color="blue"
              />
              <StatCard
                title="Active Exams"
                value={mockStats.activeExams}
                subtitle="Currently running"
                icon={Clock}
                color="orange"
              />
              <StatCard
                title="Completed Exams"
                value={mockStats.completedExams}
                subtitle="Successfully finished"
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                title="Total Students"
                value={mockStats.totalStudents}
                subtitle="Enrolled students"
                icon={Users}
                color="purple"
              />
              <StatCard
                title="Average Score"
                value={`${mockStats.averageScore}%`}
                subtitle="Overall performance"
                icon={BarChart3}
                color="blue"
              />
              <StatCard
                title="Pass Rate"
                value={`${mockStats.passRate}%`}
                subtitle="Success percentage"
                icon={TrendingUp}
                color="green"
              />
            </motion.div>

            {/* Recent Exams */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Exams</CardTitle>
                  <CardDescription>
                    Latest examination activities and their status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{exam.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {exam.class} • {exam.date} • {exam.duration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(exam.status)}>
                            {exam.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {exam.studentsEnrolled} students
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Examination List</CardTitle>
                <CardDescription>
                  View and manage all examinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Examination list and management features are currently under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Exam</CardTitle>
                <CardDescription>
                  Set up a new examination with questions and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Exam creation interface is currently under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Examinations</CardTitle>
                <CardDescription>
                  Review and grade student submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Grading interface is currently under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Examination Results</CardTitle>
                <CardDescription>
                  View detailed results and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Results and analytics features are currently under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  Manage student enrollments and information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Student management features are currently under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExamManagement;