# 🔍 BiasLens  
### Fairness and Bias Detection for Tabular Datasets — Right in Your Browser

BiasLens is a **privacy-first web app** that helps you detect **demographic bias in datasets** before training machine learning models.

Upload a CSV, choose a sensitive attribute (like gender or age), select an outcome column (like hired or approved), and instantly get a **clear, explainable fairness report**.

- 🔒 No login required  
- 🛑 No server upload — everything runs locally  
- ⚡ Fast, lightweight, and easy to use  

---

## 🧠 Why BiasLens?

Most fairness tools:
- Require Python and complex setup  
- Work only after model training  
- Are difficult for beginners  

BiasLens focuses on:
> **Understanding dataset bias at the very first step**

Perfect for:
- Students  
- Data scientists  
- ML engineers  
- Hackathon teams  

---

## ✨ Features

### 📂 Easy CSV Upload
- Drag-and-drop support  
- Streaming parser for large files  
- Live upload progress  

### 🤖 Smart Column Detection
- Automatically suggests:
  - Sensitive attributes (e.g., gender, race)  
  - Target columns (e.g., hired, approved)  

---

### 📊 Fairness Metrics

BiasLens computes:

- **Selection Rate**
- **95% Wilson Confidence Intervals**
- **Disparate Impact Ratio (Four-Fifths Rule)**
- **Statistical Parity Difference**
- **Two-Proportion Z-Test (p-values)**

---

### 🧩 Intersectional Analysis
- Combine two attributes (e.g., gender × age)  
- Discover deeper bias patterns  

---

### ⚠️ Data Quality Checks
- Missing values detection  
- Small group warnings (<30 rows)  
- Non-binary target validation  

---

### 📖 Explainable Reports
- Clear fairness verdict  
- Plain-English explanation  
- Easy-to-understand insights  

---

### 📈 Interactive Charts
- Group-wise comparison  
- Confidence interval error bars  
- Color-coded visualization  

---

### 📤 Export Options
- Download CSV results  
- Copy summary  
- Export report as PDF  

---

### 🧪 Built-in Sample Dataset
- Try instantly without uploading data  

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
