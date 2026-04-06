import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Mail, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type AuthMode = 'signin' | 'signup' | 'google'

interface AuthFormState {
  email: string
  password: string
}

const initialFormState: AuthFormState = {
  email: '',
  password: '',
}

export function Auth() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [workingMode, setWorkingMode] = useState<AuthMode | null>(null)
  const [signInForm, setSignInForm] = useState<AuthFormState>(initialFormState)
  const [signUpForm, setSignUpForm] = useState<AuthFormState>(initialFormState)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [navigate, user])

  const isSubmitting = useMemo(() => workingMode !== null, [workingMode])

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWorkingMode('signin')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Welcome back!')
      navigate('/', { replace: true })
    } catch {
      toast.error('Sign in failed. Please try again.')
    } finally {
      setWorkingMode(null)
    }
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWorkingMode('signup')

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Account created. Check your email to confirm your account.')
      setActiveTab('signin')
    } catch {
      toast.error('Sign up failed. Please try again.')
    } finally {
      setWorkingMode(null)
    }
  }

  const handleGoogleAuth = async () => {
    setWorkingMode('google')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch {
      toast.error('Google sign in failed. Please try again.')
      setWorkingMode(null)
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-500">
        Loading account...
      </section>
    )
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Welcome to MazdaCare</CardTitle>
          <CardDescription>Sign in to manage your Mazda service history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form className="space-y-3" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={signInForm.email}
                    onChange={(event) =>
                      setSignInForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={signInForm.password}
                    onChange={(event) =>
                      setSignInForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <LogIn className="h-4 w-4" />
                  {workingMode === 'signin' ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form className="space-y-3" onSubmit={handleSignUp}>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={signUpForm.email}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={signUpForm.password}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <UserPlus className="h-4 w-4" />
                  {workingMode === 'signup' ? 'Creating account...' : 'Create account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-xs text-slate-500">OR</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isSubmitting}>
            <Mail className="h-4 w-4" />
            {workingMode === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
