// Plain language error messages for better user experience
export const getPlainErrorMessage = (error, context = 'general') => {
  const errorString = typeof error === 'string' ? error.toLowerCase() : error?.message?.toLowerCase() || '';
  
  // Authentication errors
  if (errorString.includes('authentication failed') || errorString.includes('invalid credentials') || errorString.includes('unauthorized')) {
    return 'The email or password you entered is incorrect. Please check and try again.';
  }
  
  if (errorString.includes('email not found') || errorString.includes('user not found')) {
    return 'We couldn\'t find an account with that email address. Please check the email and try again.';
  }
  
  if (errorString.includes('password too weak') || errorString.includes('weak password')) {
    return 'Please choose a stronger password with at least 8 characters, including letters and numbers.';
  }
  
  if (errorString.includes('email already exists') || errorString.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  
  // Network and connection errors
  if (errorString.includes('network') || errorString.includes('connection') || errorString.includes('timeout') || errorString.includes('fetch')) {
    return 'Connection problem. Please check your internet connection and try again.';
  }
  
  if (errorString.includes('server error') || errorString.includes('internal error') || errorString.includes('500')) {
    return 'Something went wrong on our end. Please try again in a few moments.';
  }
  
  // Validation errors
  if (errorString.includes('invalid input') || errorString.includes('validation failed') || errorString.includes('required field')) {
    return 'Please fill in all required fields with valid information.';
  }
  
  if (errorString.includes('invalid email') || errorString.includes('email format')) {
    return 'Please enter a valid email address (like: example@email.com).';
  }
  
  if (errorString.includes('invalid date') || errorString.includes('date format')) {
    return 'Please enter a valid date.';
  }
  
  if (errorString.includes('invalid amount') || errorString.includes('amount format')) {
    return 'Please enter a valid amount (numbers only, like: 25.50).';
  }
  
  // File and data errors
  if (errorString.includes('file too large') || errorString.includes('size limit')) {
    return 'The file you selected is too large. Please choose a smaller file.';
  }
  
  if (errorString.includes('invalid file') || errorString.includes('file format')) {
    return 'Please select a valid file format (CSV files only).';
  }
  
  if (errorString.includes('no data') || errorString.includes('empty file')) {
    return 'The file appears to be empty. Please check your file and try again.';
  }
  
  // Permission errors
  if (errorString.includes('permission denied') || errorString.includes('access denied') || errorString.includes('forbidden')) {
    return 'You don\'t have permission to perform this action. Please contact your administrator.';
  }
  
  // Category and expense errors
  if (context === 'expenses') {
    if (errorString.includes('category not found')) {
      return 'The selected category is no longer available. Please choose a different category.';
    }
    
    if (errorString.includes('expense not found')) {
      return 'The expense you\'re looking for couldn\'t be found. It may have been deleted.';
    }
  }
  
  if (context === 'categories') {
    if (errorString.includes('category in use')) {
      return 'This category is currently being used by existing expenses and cannot be deleted.';
    }
    
    if (errorString.includes('duplicate category')) {
      return 'A category with this name already exists. Please choose a different name.';
    }
  }
  
  // Default fallback messages
  if (errorString.includes('failed') || errorString.includes('error')) {
    return 'Something didn\'t work as expected. Please try again or contact support if the problem continues.';
  }
  
  // If we can't categorize the error, return a helpful generic message
  return 'Something went wrong. Please try again, and if you continue to have problems, please contact support.';
};

// Success messages in plain language
export const getPlainSuccessMessage = (action, context = 'general') => {
  const messages = {
    create: {
      expense: 'Your expense has been recorded successfully!',
      category: 'New category created successfully!',
      user: 'User account created successfully!',
      general: 'Created successfully!'
    },
    update: {
      expense: 'Your expense has been updated successfully!',
      category: 'Category updated successfully!',
      user: 'User account updated successfully!',
      general: 'Updated successfully!'
    },
    delete: {
      expense: 'Expense has been deleted successfully!',
      category: 'Category has been deleted successfully!',
      user: 'User account has been deleted successfully!',
      general: 'Deleted successfully!'
    },
    import: {
      expense: 'Your expenses have been imported successfully!',
      general: 'Data imported successfully!'
    },
    export: {
      expense: 'Your expenses have been exported successfully!',
      general: 'Data exported successfully!'
    },
    login: 'Welcome back! You\'ve been signed in successfully.',
    logout: 'You\'ve been signed out safely.',
    save: 'Your changes have been saved successfully!'
  };
  
  return messages[action]?.[context] || messages[action]?.general || 'Action completed successfully!';
};