export type Locale = "ar" | "en";
export const messages = {
  ar: {
    brand: "مَصنوع", subtitle: "استوديو الفيديو بالذكاء الاصطناعي",
    dashboard: "مساحة العمل", newProject: "مشروع جديد", projects: "مشاريعي",
    invite: "دعوة مستخدم", signOut: "تسجيل الخروج", private: "مساحة خاصة",
    headline: "حوّل فكرتك إلى فيديو", intro: "اكتب الفكرة، راجع السيناريو والصور، ثم وافق على إنتاج الفيديو.",
    idea: "ما فكرة الفيديو؟", ideaHint: "مثال: قصة سفينة اختفت في المحيط منذ خمسين عامًا...",
    format: "صيغة الفيديو", long: "يوتيوب طويل", shorts: "YouTube Shorts",
    language: "لغة المحتوى", arabic: "العربية", english: "English", duration: "المدة المستهدفة",
    create: "إنشاء مسودة السيناريو", review: "مراجعة السيناريو", approve: "اعتماد السيناريو والمتابعة للصور",
    imageReview: "مراجعة الصور", render: "الموافقة على إنتاج الفيديو", coming: "سيتم تفعيل التوليد بعد ربط مفاتيح مزودي الذكاء الاصطناعي.",
    login: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور", loginButton: "دخول",
    loginHelp: "الدخول بالدعوة فقط. لا يوجد تسجيل عام.", loading: "جارٍ التحميل...",
    inviteEmail: "بريد المستخدم المدعو", sendInvite: "إرسال الدعوة", inviteHelp: "يمكن للمسؤول فقط دعوة مستخدمين جدد.",
    adminOnly: "هذه الصفحة للمسؤول فقط.", noProjects: "لا توجد مشاريع بعد. ابدأ بإنشاء مشروعك الأول.",
    statusDraft: "مسودة", statusReview: "بانتظار المراجعة", statusImages: "مراجعة الصور",
    statusReady: "جاهز للإنتاج", saved: "تم حفظ المشروع", error: "حدث خطأ. حاول مرة أخرى.",
    scriptPlaceholder: "سيظهر السيناريو هنا بعد توليده أو يمكنك تحريره...",
    scenes: "المشاهد", sceneNote: "في النسخة التالية ستظهر هنا الصور المولدة لكل مشهد مع إمكانية إعادة التوليد.",
    admin: "الإدارة", member: "عضو", owner: "المالك"
  },
  en: {
    brand: "MASNOO3", subtitle: "AI Video Studio", dashboard: "Workspace",
    newProject: "New project", projects: "My projects", invite: "Invite user", signOut: "Sign out",
    private: "Private workspace", headline: "Turn your idea into a video",
    intro: "Write an idea, review the script and images, then approve video production.",
    idea: "What is your video about?", ideaHint: "Example: The story of a ship that vanished in the ocean 50 years ago...",
    format: "Video format", long: "YouTube long-form", shorts: "YouTube Shorts",
    language: "Content language", arabic: "Arabic", english: "English", duration: "Target duration",
    create: "Create script draft", review: "Review script", approve: "Approve script and continue to images",
    imageReview: "Review images", render: "Approve video production",
    coming: "Generation will be enabled after connecting AI provider keys.",
    login: "Sign in", email: "Email address", password: "Password", loginButton: "Sign in",
    loginHelp: "Invitation only. Public registration is disabled.", loading: "Loading...",
    inviteEmail: "Invitee email", sendInvite: "Send invitation", inviteHelp: "Only the administrator can invite users.",
    adminOnly: "This page is for administrators only.", noProjects: "No projects yet. Create your first project.",
    statusDraft: "Draft", statusReview: "Needs review", statusImages: "Review images",
    statusReady: "Ready to render", saved: "Project saved", error: "Something went wrong. Try again.",
    scriptPlaceholder: "Your script will appear here after generation, or you can edit it...",
    scenes: "Scenes", sceneNote: "Generated scene images and regeneration controls will appear here in the next stage.",
    admin: "Admin", member: "Member", owner: "Owner"
  }
} as const;
