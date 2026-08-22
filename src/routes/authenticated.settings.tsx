
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { supabase } from '../lib/supabase'
import { signOut, updatePassword } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { Settings, User, Lock, LogOut, KeyRound } from 'lucide-react'


export default function SettingsPage( {
  const navigate = useNavigate(
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false
  const [currentPassword, setCurrentPassword] = useState(''
  const [newPassword, setNewPassword] = useState(''
  const [confirmPassword, setConfirmPassword] = useState(''
  const [updatingPassword, setUpdatingPassword] = useState(false
  const [profile, setProfile] = useState<any>(null
  const [loading, setLoading] = useState(true

  useEffect(( => {
    const fetchProfile = async ( => {
      try {
        const user = (await supabase.auth.getUser(.data.user
        if (!user throw new Error('Not authenticated'

        const { data, error } = await supabase
          .from('profiles'
          .select('*'
          .eq('id', user.id
          .single(

        if (error throw error
        setProfile(data
      } catch (error {
        console.error('Failed to fetch profile:', error
      } finally {
        setLoading(false
      }
    }

    fetchProfile(
  }, []

  const handlePasswordUpdate = async (e: React.FormEvent => {
    e.preventDefault(
    
    if (newPassword !== confirmPassword {
      alert('Passwords do not match'
      return
    }

    if (newPassword.length < 6 {
      alert('Password must be at least 6 characters'
      return
    }

    setUpdatingPassword(true
    try {
      const result = await updatePassword(newPassword
      if (result.error {
        alert(result.error.message
      } else {
        alert('Password updated successfully'
        setPasswordDialogOpen(false
        setCurrentPassword(''
        setNewPassword(''
        setConfirmPassword(''
      }
    } catch (error {
      console.error('Failed to update password:', error
      alert('Failed to update password'
    } finally {
      setUpdatingPassword(false
    }
  }

  const handleSignOut = async ( => {
    await signOut(
    router.navigate({ to: '/auth' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-accent" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Your account details and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <div className="mt-1 p-2 bg-surface-alt rounded border border-border">
                {profile?.email}
              </div>
            </div>
            <div>
              <Label>Full Name</Label>
              <div className="mt-1 p-2 bg-surface-alt rounded border border-border">
                {profile?.full_name || 'Not set'}
              </div>
            </div>
            <div>
              <Label>Account Created</Label>
              <div className="mt-1 p-2 bg-surface-alt rounded border border-border">
                {profile?.created_at ? new Date(profile.created_at.toLocaleDateString( : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Update your account password
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e => setNewPassword(e.target.value}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e => setConfirmPassword(e.target.value}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updatingPassword}>
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-danger" />
            <CardTitle className="text-danger">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              variant="destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  
}







