# CRUD Operations Guide

## Features Added

Your church directory app now has full CRUD (Create, Read, Update, Delete) functionality!

### ✅ What's New

1. **Create New Entries**
   - "Add Church" button on the Churches page
   - "Add Clergy" button on the Clergy page

2. **Edit Existing Entries**
   - "Edit" button on each church/clergy details page
   - Form pre-fills with existing data

3. **Delete Entries**
   - "Delete" button on each church/clergy details page
   - Confirmation dialog to prevent accidental deletion

### 📱 How to Use

#### Creating a New Church
1. Go to `/churches`
2. Click the **"Add Church"** button at the top
3. Fill in the form:
   - Church Name (required)
   - Location (required)
   - Head Pastor (required)
   - Number of Members (required)
   - Annual Income (required)
   - Image URLs (optional, comma-separated)
4. Click **"Create"**

#### Creating a New Clergy Member
1. Go to `/clergy`
2. Click the **"Add Clergy"** button at the top
3. Fill in the form:
   - Full Name (required)
   - Age (required, 18-120)
   - Position (required)
   - Profile Image URL (required)
   - Clergy Type (dropdown: Bishop, Mother, Sister, etc.)
   - Marital Status (dropdown: Single, Married, etc.)
   - Church ID (required - reference to a church)
4. Click **"Create"**

#### Editing an Entry
1. Navigate to any church or clergy details page
2. Click the **"Edit"** button in the top-right corner
3. Update the fields you want to change
4. Click **"Update"**

#### Deleting an Entry
1. Navigate to any church or clergy details page
2. Click the **"Delete"** button in the top-right corner
3. Confirm the deletion in the dialog
4. You'll be redirected back to the list page

### 🎨 UI Components

The CRUD interface uses:
- **Dialog/Modal Forms** - For create and edit operations
- **Alert Dialogs** - For delete confirmations
- **Loading States** - Spinner icons while processing
- **Form Validation** - Required fields and input types
- **Success Callbacks** - Auto-refresh data after operations

### 🔧 Technical Details

#### New Components Created

1. **ChurchFormDialog** (`components/ChurchFormDialog.tsx`)
   - Reusable dialog for creating/editing churches
   - Handles both create (POST) and update (PUT) operations
   - Form validation and loading states

2. **PastorFormDialog** (`components/PastorFormDialog.tsx`)
   - Reusable dialog for creating/editing clergy
   - Dropdown selects for clergy type and marital status
   - Form validation and loading states

3. **DeleteButton** (`components/DeleteButton.tsx`)
   - Reusable delete button with confirmation dialog
   - Works for both churches and pastors
   - Redirects after successful deletion

#### API Endpoints Used

- `POST /api/churches` - Create church
- `PUT /api/churches/[id]` - Update church
- `DELETE /api/churches/[id]` - Delete church
- `POST /api/pastors` - Create pastor
- `PUT /api/pastors/[id]` - Update pastor
- `DELETE /api/pastors/[id]` - Delete pastor

#### Pages Updated

- `/app/churches/page.tsx` - Added "Add Church" button
- `/app/churches/[id]/page.tsx` - Added Edit and Delete buttons
- `/app/clergy/page.tsx` - Added "Add Clergy" button
- `/app/clergy/[id]/page.tsx` - Added Edit and Delete buttons

### 📝 Form Fields

#### Church Form
```typescript
{
  name: string;           // Church name
  location: string;       // City, State
  head_pastor: string;    // Pastor's name
  members: number;        // Total members
  income: number;         // Annual income
  images: string[];       // Comma-separated URLs
}
```

#### Clergy Form
```typescript
{
  name: string;           // Full name
  age: number;            // 18-120
  position: string;       // Job title
  profile_image: string;  // Image URL
  clergy_type: ClergyType;    // Dropdown selection
  marital_status: MaritalStatus; // Dropdown selection
  church: string;         // Church ID reference
}
```

### 🎯 Tips

1. **Image URLs**: You can use any publicly accessible image URL. For production, use the `/api/upload` endpoint to upload to Cloudinary.

2. **Church IDs**: When creating clergy, you need to provide a valid Church ID. You can find this in the URL when viewing a church details page.

3. **Validation**: All required fields must be filled before submitting. The browser will show validation errors.

4. **Auto-Refresh**: After creating, updating, or deleting, the page automatically refreshes to show the latest data.

5. **Error Handling**: If an operation fails, you'll see an alert with the error message.

### 🚀 Next Steps

**Optional Enhancements:**
- Add image upload UI using the Cloudinary upload endpoint
- Add a church selector dropdown in the clergy form
- Add pagination for large datasets
- Add bulk operations (delete multiple, export, etc.)
- Add search in the form dialogs
- Add form field validation with better error messages

### 🐛 Troubleshooting

**"Church not found" errors:**
- Make sure MongoDB is connected
- Check that you're using valid MongoDB ObjectIDs

**Form won't submit:**
- Check all required fields are filled
- Open browser console (F12) for error messages

**Delete doesn't work:**
- Ensure you have a valid ID
- Check MongoDB connection

---

Your CRUD operations are fully functional! 🎉
