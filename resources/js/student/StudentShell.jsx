import { useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import MyTrilhaPage from '@/student/pages/MyTrilhaPage';
import LessonPage from '@/student/pages/LessonPage';
import ProgressPage from '@/student/pages/ProgressPage';
import PracticePage from '@/student/pages/PracticePage';
import StudentActivityPlayer from '@/student/StudentActivityPlayer';
import { logout } from '@/student/lib/logout';
import DetPracticePage from '@/pages/DetPracticePage';
import CambridgePracticePage from '@/pages/CambridgePracticePage';
import { BusinessHomePage, BusinessLessonPage, BusinessProgressPage } from '@/student/business/BusinessPages';
import { useLightUi, isLightCourse } from '@/lib/uiTheme';

const GRADIENT = 'linear-gradient(157deg,#1A0F3D 0%,#2A1560 30%,#5A1B73 62%,#8E2160 86%,#B8433A 118%)';

// A blocked / not-ready state — its own screen, no nav.
function Notice({ title, body }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-8 gap-3" style={{ background: GRADIENT }}>
            <img src="/brand/aurora-logo-horizontal-white.png" alt="Aurora" className="h-9 w-auto mb-4" />
            <h1 className="font-display text-xl font-bold text-white">{title}</h1>
            <p className="text-white/70 text-sm max-w-xs leading-relaxed">{body}</p>
            <button onClick={logout} className="mt-4 text-white/60 hover:text-white text-sm underline cursor-pointer">Log out</button>
        </div>
    );
}

// The student's trilha and active flag are read once, when the page loads (window.__AURORA_USER__), and the
// lesson list is cached — so a teacher changing the trilha (or pausing the account) did nothing on a phone that
// already had the app open. Ask the server again whenever the app comes back to the foreground, and once a minute
// while it is visible; if either changed, reload so the whole app starts from the new state.
function useFreshAccount(user) {
    useEffect(() => {
        let last = 0;
        const check = async () => {
            if (document.visibilityState !== 'visible' || Date.now() - last < 10_000) return;
            last = Date.now();
            try {
                const { data } = await axios.get('/api/me');
                if (data.trilha !== user.trilha || data.is_active !== user.is_active) window.location.reload();
            } catch { /* offline or a blip — try again next time */ }
        };
        const timer = setInterval(check, 60_000);
        document.addEventListener('visibilitychange', check);
        window.addEventListener('focus', check);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', check);
            window.removeEventListener('focus', check);
        };
    }, [user.trilha, user.is_active]);
}

export default function StudentShell({ user }) {
    useFreshAccount(user);
    // Aurora Business students get the clean light app (BusinessShell below): Course + Progress only.
    const business = user.is_active !== false && isLightCourse(user.trilha);
    useLightUi(business);

    if (user.is_active === false) {
        return <Notice title="Your account is paused" body="Ask your Aurora teacher to reactivate it, then log in again." />;
    }
    if (!user.trilha) {
        return <Notice title="No trilha yet" body="Your teacher hasn't put you on a trilha yet. Check back soon." />;
    }

    if (business) return <BusinessShell user={user} />;

    const tabCls = ({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold font-display transition-colors ${
            isActive ? 'text-[#fc6840]' : 'text-white/45'
        }`;

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* gradient ground — a fixed layer is more reliable on mobile than background-attachment:fixed */}
            <div className="fixed inset-0 -z-10" style={{ background: GRADIENT }} />
            <div className="flex-1 w-full max-w-[520px] mx-auto pb-24">
                <Routes>
                    <Route path="/s" element={<MyTrilhaPage user={user} />} />
                    <Route path="/s/lesson/:n" element={<LessonPage user={user} />} />
                    <Route path="/s/activity/:id" element={<StudentActivityPlayer />} />
                    <Route path="/s/practice" element={<PracticePage />} />
                    <Route path="/s/practice/det/:type" element={<DetPracticePage backTo={{ path: '/s/practice', state: { mode: 'det' } }} />} />
                    <Route path="/s/practice/cambridge/:type" element={<CambridgePracticePage backTo={{ path: '/s/practice', state: { mode: 'cambridge' } }} />} />
                    <Route path="/s/practice/cambridge-a2/:type" element={<CambridgePracticePage level="a2" backTo={{ path: '/s/practice', state: { mode: 'cambridge' } }} />} />
                    <Route path="/s/progress" element={<ProgressPage user={user} />} />
                    <Route path="*" element={<Navigate to="/s" replace />} />
                </Routes>
            </div>

            <nav className="fixed bottom-0 inset-x-0 h-[66px] flex bg-[#0c0722]/70 backdrop-blur-xl border-t border-white/10 z-30">
                <div className="w-full max-w-[520px] mx-auto flex">
                    <NavLink to="/s" end className={tabCls}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5V21H3z" /></svg>
                        My Trilha
                    </NavLink>
                    <NavLink to="/s/practice" className={tabCls}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>
                        Practice
                    </NavLink>
                    <NavLink to="/s/progress" className={tabCls}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
                        Progress
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}

// The Aurora Business student app (AuroraBusiness.md §5): light, two tabs — Course and Progress. No Practice tab and
// no Cambridge / DET routes (Thiago, 2026-11-10: "as clean as possible"); an old practice link lands on Course.
function BusinessShell({ user }) {
    const tabCls = ({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-1 text-[13px] font-semibold min-h-11 ${isActive ? 'text-[#9A3412]' : 'text-[#4A5163]'}`;
    return (
        <div className="min-h-screen flex flex-col bg-[#F6F7F9] text-[#271D62]">
            <div className="flex-1 w-full max-w-[520px] mx-auto pb-28">
                <Routes>
                    <Route path="/s" element={<BusinessHomePage user={user} />} />
                    <Route path="/s/lesson/:n" element={<BusinessLessonPage user={user} />} />
                    <Route path="/s/activity/:id" element={<StudentActivityPlayer />} />
                    <Route path="/s/progress" element={<BusinessProgressPage user={user} />} />
                    <Route path="*" element={<Navigate to="/s" replace />} />
                </Routes>
            </div>
            <nav aria-label="Main" className="fixed bottom-0 inset-x-0 h-[72px] bg-white border-t border-[#DDE1E8] z-30">
                <div className="w-full max-w-[520px] mx-auto h-full grid grid-cols-2">
                    <NavLink to="/s" end className={tabCls}>
                        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /><path d="M8 7h6" /></svg>
                        Course
                    </NavLink>
                    <NavLink to="/s/progress" className={tabCls}>
                        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
                        Progress
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}
