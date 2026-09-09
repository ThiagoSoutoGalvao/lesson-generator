import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import MyTrilhaPage from '@/student/pages/MyTrilhaPage';
import LessonPage from '@/student/pages/LessonPage';
import ProgressPage from '@/student/pages/ProgressPage';
import StudentActivityPlayer from '@/student/StudentActivityPlayer';

const GRADIENT = 'linear-gradient(157deg,#1A0F3D 0%,#2A1560 30%,#5A1B73 62%,#8E2160 86%,#B8433A 118%)';

function logout() {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
    const t = document.createElement('input');
    t.type = 'hidden';
    t.name = '_token';
    t.value = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
    form.appendChild(t);
    document.body.appendChild(form);
    form.submit();
}

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

export default function StudentShell({ user }) {
    if (user.is_active === false) {
        return <Notice title="Your account is paused" body="Ask your Aurora teacher to reactivate it, then log in again." />;
    }
    if (!user.trilha) {
        return <Notice title="No trilha yet" body="Your teacher hasn't put you on a trilha yet. Check back soon." />;
    }

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
                    <NavLink to="/s/progress" className={tabCls}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
                        Progress
                    </NavLink>
                </div>
            </nav>
        </div>
    );
}
