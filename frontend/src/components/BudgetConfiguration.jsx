import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/SupabaseAuthContext';
import { formatCurrency } from '../utils/currency';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Target,
  Settings,
  AlertTriangle,
  TrendingUp,
  Save,
  RotateCcw,
  Info,
  DollarSign,
  Loader2
} from 'lucide-react';

const BudgetConfiguration = ({ onBudgetUpdate }) => {
  const { apiCall, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Budget settings state
  const [budgetSettings, setBudgetSettings] = useState({
    monthlyBudget: 50000,
    warningThreshold: 80,
    emergencyThreshold: 95,
    currencyCode: 'INR'
  });

  // Form state for editing
  const [formSettings, setFormSettings] = useState({ ...budgetSettings });

  useEffect(() => {
    if (isOpen) {
      fetchBudgetSettings();
    }
  }, [isOpen]);

  const fetchBudgetSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try to fetch user budget settings
      const response = await apiCall('/budget/settings', 'GET');
      
      if (response.settings) {
        const settings = {
          monthlyBudget: response.settings.monthly_budget || 50000,
          warningThreshold: (response.settings.warning_threshold || 0.8) * 100,
          emergencyThreshold: (response.settings.emergency_threshold || 0.95) * 100,
          currencyCode: response.settings.currency_code || 'INR'
        };
        
        setBudgetSettings(settings);
        setFormSettings({ ...settings });
      }
    } catch (err) {
      console.error('Failed to fetch budget settings:', err);
      // Use default settings if API fails
      const defaultSettings = {
        monthlyBudget: 50000,
        warningThreshold: 80,
        emergencyThreshold: 95,
        currencyCode: 'INR'
      };
      setBudgetSettings(defaultSettings);
      setFormSettings({ ...defaultSettings });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validate settings
      if (formSettings.monthlyBudget <= 0) {
        throw new Error('Monthly budget must be greater than 0');
      }

      if (formSettings.warningThreshold >= formSettings.emergencyThreshold) {
        throw new Error('Warning threshold must be less than emergency threshold');
      }

      const requestBody = {
        monthly_budget: formSettings.monthlyBudget,
        warning_threshold: formSettings.warningThreshold / 100,
        emergency_threshold: formSettings.emergencyThreshold / 100,
        currency_code: formSettings.currencyCode
      };

      console.log('Sending budget update request:', requestBody);
      
      const response = await apiCall('/budget/settings', 'PUT', requestBody);

      if (response.success) {
        setBudgetSettings({ ...formSettings });
        setSuccess('Budget settings updated successfully!');
        
        // Notify parent component about budget update
        if (onBudgetUpdate) {
          onBudgetUpdate({
            monthlyBudget: formSettings.monthlyBudget,
            warningThreshold: formSettings.warningThreshold / 100,
            emergencyThreshold: formSettings.emergencyThreshold / 100
          });
        }

        setTimeout(() => {
          setIsOpen(false);
          setSuccess('');
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to update budget settings');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormSettings({ ...budgetSettings });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    handleReset();
    setIsOpen(false);
  };

  const formatSliderValue = (value) => {
    return `${value}%`;
  };

  const calculateThresholdAmounts = () => {
    return {
      warningAmount: formSettings.monthlyBudget * (formSettings.warningThreshold / 100),
      emergencyAmount: formSettings.monthlyBudget * (formSettings.emergencyThreshold / 100)
    };
  };

  const thresholdAmounts = calculateThresholdAmounts();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Budget Settings
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Budget Configuration
          </DialogTitle>
          <DialogDescription>
            Set your monthly budget and spending alert thresholds to better manage your expenses.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading budget settings...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Monthly Budget Setting */}
            <div className="space-y-3">
              <Label htmlFor="monthly-budget" className="text-base font-semibold">
                Monthly Budget
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="monthly-budget"
                  type="number"
                  value={formSettings.monthlyBudget}
                  onChange={(e) => setFormSettings(prev => ({
                    ...prev,
                    monthlyBudget: parseFloat(e.target.value) || 0
                  }))}
                  className="pl-10"
                  placeholder="Enter monthly budget"
                  min="1"
                  step="100"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Your target monthly spending limit: {formatCurrency(formSettings.monthlyBudget)}
              </p>
            </div>

            {/* Threshold Settings */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Alert Thresholds</h3>
              
              {/* Warning Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Warning Level
                  </Label>
                  <span className="text-sm font-medium text-yellow-600">
                    {formatSliderValue(formSettings.warningThreshold)}
                  </span>
                </div>
                <Slider
                  value={[formSettings.warningThreshold]}
                  onValueChange={(value) => setFormSettings(prev => ({
                    ...prev,
                    warningThreshold: value[0]
                  }))}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Get warned when spending reaches {formatCurrency(thresholdAmounts.warningAmount)}
                </p>
              </div>

              {/* Emergency Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    Emergency Level
                  </Label>
                  <span className="text-sm font-medium text-red-600">
                    {formatSliderValue(formSettings.emergencyThreshold)}
                  </span>
                </div>
                <Slider
                  value={[formSettings.emergencyThreshold]}
                  onValueChange={(value) => setFormSettings(prev => ({
                    ...prev,
                    emergencyThreshold: value[0]
                  }))}
                  max={100}
                  min={formSettings.warningThreshold + 5}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Get critical alerts when spending reaches {formatCurrency(thresholdAmounts.emergencyAmount)}
                </p>
              </div>
            </div>

            {/* Budget Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(thresholdAmounts.warningAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">Safe Zone</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {formatCurrency(thresholdAmounts.emergencyAmount - thresholdAmounts.warningAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">Warning Zone</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(formSettings.monthlyBudget - thresholdAmounts.emergencyAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">Danger Zone</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These settings will be used in your analytics dashboard to provide personalized 
                spending insights and budget tracking. You can adjust them anytime.
              </AlertDescription>
            </Alert>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading || saving}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetConfiguration;