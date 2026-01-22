import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            alert('Đăng nhập thất bại: ' + error.message)
        } else {
            navigate('/')
        }
        setLoading(false)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-primary-600">VN PIT Tax</h1>
                    <p className="text-slate-500 mt-2">Hệ thống tính thuế TNCN</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full rounded-md border border-slate-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border border-slate-300 p-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-primary-600 py-2.5 px-4 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                {/* <div className="mt-4 text-center">
            <button onClick={handleSignUp} className="text-sm text-slate-500 hover:text-primary-600">Đăng ký tài khoản mới</button>
        </div> */}
            </div>
        </div>
    )
}
