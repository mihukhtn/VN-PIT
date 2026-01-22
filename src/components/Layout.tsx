import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Users, Calculator, LogOut, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const [sessionChecked, setSessionChecked] = useState(false)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login')
            }
            setSessionChecked(true)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login')
        })
        return () => subscription.unsubscribe()
    }, [navigate])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
        <Link
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={clsx(
                "flex items-center gap-3 p-3 rounded-lg transition-colors font-medium",
                location.pathname === to ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-slate-50 text-slate-500"
            )}
        >
            <Icon size={20} className={location.pathname === to ? "text-primary-600" : "text-slate-400"} />
            <span>{label}</span>
        </Link>
    )

    if (!sessionChecked) return null

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Header */}
            <div className="md:hidden fixed z-20 w-full bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-lg font-bold text-primary-600">VN PIT Tax</h1>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={clsx(
                "fixed md:static inset-y-0 left-0 z-10 w-64 bg-white border-r transform transition-transform duration-300 md:transform-none flex flex-col shadow-lg md:shadow-none",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b hidden md:block">
                    <h1 className="text-2xl font-bold text-primary-600 flex items-center gap-2">
                        <Calculator className="h-8 w-8" />
                        VN PIT Tax
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-14 md:mt-0">
                    <NavItem to="/" icon={Users} label="Quản lý Nhân sự" />
                    <NavItem to="/tax" icon={Calculator} label="Tính Thuế TNCN" />
                </nav>

                <div className="p-4 border-t bg-slate-50">
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-slate-600 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors font-medium">
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-0 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:p-8 pt-20 p-4 w-full">
                <Outlet />
            </main>
        </div>
    )
}
