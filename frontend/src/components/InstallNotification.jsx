import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const InstallNotification = ({ 
  isVisible, 
  onInstall, 
  onDismiss, 
  onRemindLater,
  deviceType = 'desktop' 
}) => {
  if (!isVisible) return null;

  const getInstallMessage = () => {
    switch (deviceType) {
      case 'ios':
        return {
          title: '📱 Add to Home Screen',
          message: 'Install this app on your iPhone: tap the share button and then "Add to Home Screen".',
          icon: <Smartphone className="w-6 h-6" />
        };
      case 'android':
        return {
          title: '📱 Install App',
          message: 'Get the full app experience! Install this app for faster access and offline use.',
          icon: <Download className="w-6 h-6" />
        };
      default:
        return {
          title: '💻 Install App',
          message: 'Install Unique Expense Tracker for quick access from your desktop and offline use.',
          icon: <Download className="w-6 h-6" />
        };
    }
  };

  const { title, message, icon } = getInstallMessage();

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
      <Card className="shadow-lg border-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                {message}
              </p>
              <div className="flex gap-2 flex-wrap">
                {deviceType !== 'ios' && (
                  <Button
                    onClick={onInstall}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Install Now
                  </Button>
                )}
                <Button
                  onClick={onRemindLater}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 border-gray-300 dark:border-gray-600"
                >
                  Remind Later
                </Button>
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  No Thanks
                </Button>
              </div>
            </div>
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallNotification;