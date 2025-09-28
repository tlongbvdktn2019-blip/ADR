# 🔧 **Quiz Database Setup Guide**

## ❌ **Error: "Not enough questions available. Found 0, needed 10"**

This error occurs because the quiz database tables and sample data haven't been set up yet.

---

## 🚀 **Quick Fix Steps**

### **1. Open Supabase SQL Editor**
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **2. Run Database Schema (Required)**
Copy and paste the content from `supabase/adr-training-quiz-schema.sql` into the SQL editor and click **"Run"**.

Or run this command:
```sql
\i supabase/adr-training-quiz-schema.sql
```

**Expected Output:**
- ✅ Tables created: `quiz_categories`, `quiz_questions`, `quiz_sessions`, etc.
- ✅ Sample categories inserted (6 categories)

### **3. Insert Sample Questions (Required)** 
Copy and paste the content from `supabase/sample-quiz-questions.sql` into the SQL editor and click **"Run"**.

Or run this command:
```sql
\i supabase/sample-quiz-questions.sql
```

**Expected Output:**
- ✅ 100+ sample questions inserted
- ✅ Categories updated with question counts

### **4. Verify Setup**
Run this verification query:
```sql
-- Check if everything is set up correctly
SELECT 
  c.name as category_name,
  c.category_key,
  COUNT(q.id) as question_count
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id 
  AND q.is_active = true 
  AND q.review_status = 'approved'
GROUP BY c.id, c.name, c.category_key
ORDER BY c.name;
```

**Expected Result:**
```
category_name          | category_key   | question_count
WHO-UMC Assessment     | who_umc        | 15+
Naranjo Scale         | naranjo        | 10+
Drug Knowledge        | drug_knowledge | 20+
Case Studies          | case_studies   | 15+
Regulations           | regulations    | 10+
General ADR           | general        | 15+
```

---

## 🐛 **Debug Script (Optional)**

If you're still having issues, run the debug script:

```bash
node scripts/debug-quiz-db.js
```

This will show:
- ✅ Which tables exist
- ✅ How many categories and questions are in the database  
- ✅ Sample query results
- ❌ Any configuration issues

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: "relation quiz_categories does not exist"**
**Solution:** Run the schema SQL file first:
```sql
\i supabase/adr-training-quiz-schema.sql
```

### **Issue 2: "Categories found but no questions"**
**Solution:** Run the sample questions SQL file:
```sql
\i supabase/sample-quiz-questions.sql
```

### **Issue 3: "Questions exist but still getting 0 found"**
**Cause:** Questions might not be approved or active
**Solution:** Run this update:
```sql
UPDATE quiz_questions 
SET is_active = true, review_status = 'approved' 
WHERE review_status = 'pending';
```

### **Issue 4: "Category not found" error**
**Cause:** Frontend is using wrong category ID
**Solution:** Check available categories:
```sql
SELECT id, name, category_key FROM quiz_categories;
```

---

## ✅ **Success Verification**

After setup, you should be able to:
1. ✅ Visit `/training` page without errors
2. ✅ See 6 quiz categories displayed
3. ✅ Select a category and difficulty
4. ✅ Click "Start Quiz" and get 10 questions
5. ✅ Complete the quiz and see results

---

## 📧 **Still Having Issues?**

If the error persists after following these steps:

1. **Check Console Logs:** Open browser dev tools and check console for detailed errors
2. **Verify Environment:** Ensure `.env.local` has correct Supabase credentials  
3. **Database Permissions:** Ensure your Supabase service role key has proper permissions
4. **Run Debug Script:** Use `node scripts/debug-quiz-db.js` for detailed diagnosis

---

## 🎯 **Expected Final Result**

After successful setup:
- 📊 **6 categories** with themed colors and icons
- ❓ **100+ questions** across all difficulty levels  
- 🏆 **Achievement system** ready to track progress
- 📈 **Leaderboards** ready for competition
- 🎮 **Full quiz functionality** operational

**🚀 Your ADR Training Quiz System will be fully operational!**









