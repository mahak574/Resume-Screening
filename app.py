import streamlit as st
import pandas as pd
import plotly.express as px
from utils.pdf_processor import extract_text, parse_candidate_info
from utils.nlp_engine import preprocess_text, extract_skills, explain_match
from utils.skill_matcher import SkillMatcher
from db.database import Database

# --- Session State Initialization ---
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

# ADD THESE THREE LINES
if "last_results" not in st.session_state:
    st.session_state.last_results = []
if "candidate_skills_map" not in st.session_state:
    st.session_state.candidate_skills_map = {}
if "multi_jd_mode_run" not in st.session_state:
    st.session_state.multi_jd_mode_run = False

# Page Configuration
st.set_page_config(page_title="AI Resume Screener", layout="wide", page_icon="🤖")

# Initialize Database
db = Database()

# Initialize SkillMatcher
@st.cache_resource
def get_skill_matcher():
    matcher = SkillMatcher()
    try:
        matcher.load_categorizer("data/skills_db.json")
    except Exception as e:
        print(f"Failed to load skills_db.json. Ensure it exists in data/. Error: {e}")
    return matcher

skill_matcher = get_skill_matcher()

# --- Authentication ---
if "authenticated" not in st.session_state:
    st.session_state.authenticated = False

def login():
    st.sidebar.title("🔐 Recruiter Login")
    username = st.sidebar.text_input("Username")
    password = st.sidebar.text_input("Password", type="password")
    if st.sidebar.button("Login"):
        # Simple mock authentication
        if username == "admin" and password == "admin123":
            st.session_state.authenticated = True
            st.sidebar.success("Logged in successfully!")
            st.rerun()
        else:
            st.sidebar.error("Invalid credentials. Use admin/admin123")

if not st.session_state.authenticated:
    login()
    st.warning("Please login from the sidebar to access the dashboard.")
    st.stop()

# --- Main Application ---
st.title("🤖 AI-Powered Resume Screening & Candidate Ranking System")

if st.sidebar.button("Logout"):
    st.session_state.authenticated = False
    st.rerun()

# Multi-JD Mode Toggle
multi_jd_mode = st.sidebar.toggle("🔄 Multi-JD Mode (find best role for one candidate)", value=False)

# Main layout with Tabs
tab1, tab2 = st.tabs(["🔍 Screen Resumes", "📁 Past Screenings"])

with tab1:
    if multi_jd_mode:
        st.header("1. Job Descriptions")
        if "jd_count" not in st.session_state:
            st.session_state.jd_count = 2
            
        col1, col2 = st.columns([8, 2])
        with col2:
            if st.button("+ Add JD") and st.session_state.jd_count < 5:
                st.session_state.jd_count += 1
                st.rerun()
                
        jd_inputs = []
        for i in range(st.session_state.jd_count):
            st.subheader(f"Job Description {i+1}")
            role_name = st.text_input(f"Role Name {i+1}", key=f"role_{i}")
            jd_text = st.text_area(f"JD Text {i+1}", height=100, key=f"jd_{i}")
            if role_name and jd_text:
                jd_inputs.append({"role": role_name, "text": jd_text})
                
        st.header("2. Upload Candidate Resume")
        uploaded_file = st.file_uploader("Upload ONE resume (PDF or DOCX)", type=["pdf", "docx"], accept_multiple_files=False)
        uploaded_files = [uploaded_file] if uploaded_file else []
            
        analyze_button = st.button("🚀 Analyze Role Fit")
        valid_input = len(jd_inputs) > 0 and len(uploaded_files) > 0
    else:
        st.header("1. Job Description")
        jd_text = st.text_area("Paste the Job Description here:", height=150, placeholder="e.g., We are looking for a Python Developer...")
        
        with st.expander("⚙️ Advanced: Define Required Skills"):
            req_skills_str = st.text_input("Required Skills (comma-separated)", placeholder="python, aws, docker")
            nth_skills_str = st.text_input("Nice-to-Have Skills (comma-separated)", placeholder="kubernetes, tensorflow")
            
        st.header("2. Upload Candidate Resumes")
        uploaded_files = st.file_uploader("Upload resumes (PDF or DOCX)", type=["pdf", "docx"], accept_multiple_files=True)
        
        analyze_button = st.button("🚀 Analyze & Rank Candidates")
        valid_input = bool(jd_text) and bool(uploaded_files)

    if analyze_button and valid_input:
        with st.spinner("Processing documents, extracting text, and running NLP pipeline..."):
            
            # --- Common Processing ---
            if multi_jd_mode:
                jds_to_process = jd_inputs
            else:
                jds_to_process = [{"role": "", "text": jd_text}]
                
            processed_jds = []
            for jd_item in jds_to_process:
                jd_processed = preprocess_text(jd_item["text"])
                jd_embedding = skill_matcher.get_embeddings([jd_processed])[0]
                
                # Handling skills
                auto_jd_skills = extract_skills(jd_item["text"])
                req_skills = []
                nth_skills = []
                
                if not multi_jd_mode and (req_skills_str or nth_skills_str):
                    if req_skills_str:
                        req_skills = [s.strip().lower() for s in req_skills_str.split(',') if s.strip()]
                    if nth_skills_str:
                        nth_skills = [s.strip().lower() for s in nth_skills_str.split(',') if s.strip()]
                    final_jd_skills = list(set(req_skills + nth_skills))
                    if not final_jd_skills:
                        final_jd_skills = auto_jd_skills
                else:
                    final_jd_skills = auto_jd_skills
                    
                processed_jds.append({
                    "role": jd_item["role"],
                    "text": jd_item["text"],
                    "embedding": jd_embedding,
                    "skills": final_jd_skills,
                    "req_skills": req_skills,
                    "nth_skills": nth_skills
                })
            
            results = []
            candidate_skills_map = {}
            
            for file in uploaded_files:
                resume_text = extract_text(file)
                if not resume_text.strip():
                    st.warning(f"Could not extract text from {file.name}.")
                    continue
                
                resume_info = parse_candidate_info(resume_text)
                resume_name = resume_info["name"] if resume_info["name"] != "Unknown" else file.name.rsplit('.', 1)[0].replace('_', ' ').title()
                resume_email = resume_info["email"] if resume_info["email"] != "Not found" else f"{resume_name.replace(' ', '').lower()}@example.com"
                
                resume_processed = preprocess_text(resume_text)
                resume_embedding = skill_matcher.get_embeddings([resume_processed])[0]
                resume_skills = extract_skills(resume_text)
                
                exp_factor = min(resume_info["years_experience"], 10.0) / 10.0
                
                for pjd in processed_jds:
                    # Semantic Similarity
                    semantic_similarity = skill_matcher.calculate_similarity(resume_text, pjd["text"])
                    
                    # Skill Matching
                    match_res = skill_matcher.match_skills(resume_skills, pjd["skills"])
                    matched_skills_list = [m["skill"] for m in match_res["matched"]]
                    missing_skills_list = match_res["missing"]
                    
                    # Custom Missing Skills Penalty
                    if pjd["req_skills"] or pjd["nth_skills"]:
                        total_weight = len(pjd["req_skills"]) * 1.5 + len(pjd["nth_skills"]) * 0.5
                        if total_weight == 0:
                            skill_match_score = 1.0
                        else:
                            matched_weight = sum([1.5 for s in pjd["req_skills"] if s in matched_skills_list]) + \
                                             sum([0.5 for s in pjd["nth_skills"] if s in matched_skills_list])
                            skill_match_score = matched_weight / total_weight
                    else:
                        skill_match_score = match_res["match_percentage"] / 100.0
                        
                    components = {
                        "semantic_similarity": semantic_similarity,
                        "skill_match": skill_match_score,
                        "experience_factor": exp_factor
                    }
                    
                    composite_res = skill_matcher.calculate_composite_score(components)
                    match_percentage = composite_res["total_score"]
                    
                    # Explainable output
                    explanation = explain_match(matched_skills_list, pjd["skills"])
                    
                    # Save to DB
                    role_suffix = f" - {pjd['role']}" if multi_jd_mode else ""
                    db.save_candidate(f"{resume_name}{role_suffix}", resume_email, match_percentage, resume_skills, missing_skills_list)
                    
                    results.append({
                        "Candidate Name": resume_name,
                        "Role": pjd["role"],
                        "Match Percentage (%)": match_percentage,
                        "Matched Skills": ", ".join(matched_skills_list) if matched_skills_list else "None",
                        "Missing Skills": ", ".join(missing_skills_list) if missing_skills_list else "None",
                        "Explanation": explanation,
                        "Years Experience": resume_info["years_experience"]
                    })
                    if resume_name not in candidate_skills_map:
                        candidate_skills_map[resume_name] = {"matched": matched_skills_list, "missing": missing_skills_list}

            # Store results in session state for later use
            st.session_state.last_results = results
            st.session_state.candidate_skills_map = candidate_skills_map
            st.session_state.multi_jd_mode_run = multi_jd_mode
            
    elif not valid_input and analyze_button:
        st.info("Please provide the required inputs (JD and Resumes).")

    # Render Results
    if "last_results" in st.session_state and st.session_state.last_results:
        results = st.session_state.last_results
        df = pd.DataFrame(results)
        
        if st.session_state.multi_jd_mode_run:
            st.markdown("---")
            st.header("3. Best Role Fit Dashboard")
            
            # Since there's only one candidate in multi JD mode
            candidate_name = df.iloc[0]["Candidate Name"]
            st.subheader(f"Role Analysis for: {candidate_name}")
            
            fig = px.bar(
                df, 
                x="Match Percentage (%)", 
                y="Role", 
                orientation='h',
                title=f"Best Role Fit for {candidate_name}", 
                color="Match Percentage (%)", 
                color_continuous_scale="Greens",
                text="Match Percentage (%)"
            )
            fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
            fig.update_layout(xaxis_range=[0, 100])
            st.plotly_chart(fig, use_container_width=True)
            
            best_role = df.loc[df['Match Percentage (%)'].idxmax()]
            st.success(f"**Best Fit Role: {best_role['Role']}** ({best_role['Match Percentage (%)']}%)")
            
        else:
            st.markdown("---")
            st.header("3. Candidate Ranking Dashboard")
            
            # Shortlisting Slider
            shortlist_threshold = st.slider("Shortlist Threshold (%)", min_value=0, max_value=100, value=60)
            df_filtered = df[df["Match Percentage (%)"] >= shortlist_threshold].sort_values(by="Match Percentage (%)", ascending=False).reset_index(drop=True)
            
            st.metric(label="Shortlisted Candidates", value=f"{len(df_filtered)} of {len(df)}")
            
            if len(df_filtered) > 0:
                shortlist_email = f"Subject: Shortlisted Candidates — This Role\n\n"
                for _, row in df_filtered.iterrows():
                    shortlist_email += f"{row['Candidate Name']}: {row['Match Percentage (%)']}%\n"
                
                st.write("📧 Copy Shortlist Email:")
                st.code(shortlist_email, language="text")
                
                # Visualization
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.subheader("📊 Match Score Visualization")
                    fig = px.bar(
                        df_filtered, 
                        x="Candidate Name", 
                        y="Match Percentage (%)", 
                        title="ATS Candidate Match Scores", 
                        color="Match Percentage (%)", 
                        color_continuous_scale="Blues",
                        text="Match Percentage (%)"
                    )
                    fig.update_traces(texttemplate='%{text:.1f}%', textposition='outside')
                    fig.update_layout(yaxis_range=[0, 100])
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    st.subheader("🏆 Top Candidate")
                    top_candidate = df_filtered.iloc[0]
                    st.success(f"**{top_candidate['Candidate Name']}**")
                    st.metric("Match Score", f"{top_candidate['Match Percentage (%)']}%")
                    st.info(f"**Key Matches:** {top_candidate['Matched Skills']}")
                
                # Detailed Table Output
                st.subheader("📋 Detailed Candidate Analysis")
                display_df = df_filtered.drop(columns=["Role"])
                st.dataframe(display_df, use_container_width=True)
                
                # Export Functionality
                csv = display_df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 Download Results as CSV",
                    data=csv,
                    file_name='candidate_ranking.csv',
                    mime='text/csv',
                )
                
                # Skills Gap Report
                with st.expander("🎯 Skills Gap Report (for candidate)"):
                    selected_candidate_name = st.selectbox("Select Candidate", df_filtered["Candidate Name"].tolist())
                    selected_candidate = df_filtered[df_filtered["Candidate Name"] == selected_candidate_name].iloc[0]
                    
                    st.markdown(f"### Skills Gap for {selected_candidate_name}")
                    
                    st.markdown("**Matched Skills:**")
                    c_skills = st.session_state.get("candidate_skills_map", {}).get(selected_candidate_name, {"matched": [], "missing": []})
                    matched_badges = " ".join([f'<span style="background-color:#d4edda;color:#155724;padding:4px 8px;border-radius:4px;margin-right:5px;display:inline-block;margin-bottom:5px;">{s}</span>' for s in c_skills["matched"]])
                    st.markdown(matched_badges if matched_badges else "None", unsafe_allow_html=True)
                    
                    st.markdown("<br>**Missing Skills & Learning Resources:**", unsafe_allow_html=True)
                    missing_skills = c_skills["missing"]
                    
                    resources = {
                        "python": "https://www.python.org/about/gettingstarted/",
                        "java": "https://dev.java/learn/",
                        "javascript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
                        "aws": "https://aws.amazon.com/training/",
                        "docker": "https://docs.docker.com/get-started/",
                        "kubernetes": "https://kubernetes.io/docs/tutorials/",
                        "react": "https://react.dev/learn",
                        "sql": "https://www.w3schools.com/sql/",
                        "machine learning": "https://developers.google.com/machine-learning/crash-course",
                        "nlp": "https://huggingface.co/learn/nlp-course/chapter1/1",
                        "git": "https://git-scm.com/doc",
                        "linux": "https://linuxjourney.com/",
                        "c++": "https://cplusplus.com/doc/tutorial/",
                        "c#": "https://learn.microsoft.com/en-us/dotnet/csharp/",
                        "azure": "https://learn.microsoft.com/en-us/training/azure/",
                        "gcp": "https://cloud.google.com/training",
                        "node.js": "https://nodejs.dev/learn",
                        "typescript": "https://www.typescriptlang.org/docs/",
                        "spring": "https://spring.io/guides",
                        "django": "https://docs.djangoproject.com/en/stable/intro/tutorial01/"
                    }
                    
                    if missing_skills:
                        for s in missing_skills:
                            normalized_s = s.lower()
                            url = resources.get(normalized_s, f"https://www.google.com/search?q=learn+{s}")
                            st.markdown(f'- <span style="color:#721c24;font-weight:bold;">{s}</span>: [Learn here]({url})', unsafe_allow_html=True)
                    else:
                        st.markdown("No missing skills!")
                        
                    if skill_matcher.categorizer is not None:
                        st.markdown("<br>### 📂 Skills by Category", unsafe_allow_html=True)
                        categorized_skills = skill_matcher.categorizer.categorize_skills(c_skills["matched"])
                        for category, skills in categorized_skills.items():
                            if skills:
                                st.subheader(f"{category.replace('_', ' ').title()}")
                                cat_badges = " ".join([f'<span style="background-color:#d4edda;color:#155724;padding:4px 8px;border-radius:4px;margin-right:5px;display:inline-block;margin-bottom:5px;">{s}</span>' for s in skills])
                                st.markdown(cat_badges, unsafe_allow_html=True)
                        
            else:
                st.warning("No candidates met the threshold.")


with tab2:
    st.header("📁 Past Screenings")
    
    # Filter
    filter_name = st.text_input("Search by Candidate Name", "")
    
    with st.spinner("Fetching past screenings..."):
        if filter_name:
            history = db.get_candidate_history(filter_name)
        else:
            history = db.get_all_candidates()
        
    if history:
        history_df = pd.DataFrame(history)
        st.dataframe(history_df, use_container_width=True)
    else:
        if db.client is None:
            st.warning("MongoDB is currently unavailable. Past screenings cannot be retrieved.")
        else:
            st.info("No past screenings found.")