'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { getCurrentUserProfile, getUserChildren } from '@/lib/auth/rls-helpers'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  User,
  Users,
  Shield,
  Settings,
  Plus,
  Edit,
  Camera,
} from 'lucide-react'
import { UserProfileForm } from './components/UserProfileForm'
import { ChildProfileForm } from './components/ChildProfileForm'
// import { ChildProfileCard } from './components/ChildProfileCard'
import { COPPACompliancePanel } from './components/COPPACompliancePanel'
// import { ProfilePictureUpload } from './components/ProfilePictureUpload'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

interface ChildProfile {
  id: string
  name: string
  age: number | null
  reading_level: string | null
  interests: string[] | null
  parent_id: string
  created_at: string | null
  updated_at: string | null
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [showChildForm, setShowChildForm] = useState(false)
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null)

  // Load user profile and children data
  const loadProfileData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const [profileData, childrenData] = await Promise.all([
        getCurrentUserProfile(),
        getUserChildren(),
      ])

      setUserProfile(profileData)
      setChildren(childrenData)
    } catch (err) {
      console.error('Failed to load profile data:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load profile data'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && !authLoading) {
      loadProfileData()
    }
  }, [user, authLoading])

  // Handle profile updates
  const handleProfileUpdate = async () => {
    await loadProfileData()
  }

  // Handle child profile operations
  const handleChildAdded = async () => {
    setShowChildForm(false)
    await loadProfileData()
  }

  const handleChildUpdated = async () => {
    setEditingChild(null)
    await loadProfileData()
  }

  const handleEditChild = (child: ChildProfile) => {
    setEditingChild(child)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Please sign in to view your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={loadProfileData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, children's profiles, and privacy settings
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Profile
          </TabsTrigger>
          <TabsTrigger value="children" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Children ({children.length})
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy & COPPA
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* User Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Profile picture upload coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserProfileForm
                    userProfile={userProfile}
                    onUpdate={handleProfileUpdate}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Children Profiles Tab */}
        <TabsContent value="children" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Children's Profiles</h2>
              <p className="text-muted-foreground">
                Manage your children's reading profiles and preferences
              </p>
            </div>
            <Button
              onClick={() => setShowChildForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Child
            </Button>
          </div>

          {/* Children List */}
          {children.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No children added yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add your first child's profile to start creating personalized
                  stories
                </p>
                <Button onClick={() => setShowChildForm(true)}>
                  Add Your First Child
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map(child => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {child.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditChild(child)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Age:</span>
                        <span className="text-sm">
                          {child.age || 'Not set'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          Reading Level:
                        </span>
                        <Badge variant="outline">
                          {child.reading_level || 'Not set'}
                        </Badge>
                      </div>
                      {child.interests && child.interests.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">
                            Interests:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {child.interests.map((interest, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showChildForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Child</CardTitle>
              </CardHeader>
              <CardContent>
                <ChildProfileForm
                  onSave={handleChildAdded}
                  onCancel={() => setShowChildForm(false)}
                />
              </CardContent>
            </Card>
          )}

          {editingChild && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Child Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ChildProfileForm
                  childProfile={editingChild}
                  onSave={handleChildUpdated}
                  onCancel={() => setEditingChild(null)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Privacy & COPPA Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>COPPA Compliance & Privacy</CardTitle>
              <CardDescription>
                Manage privacy settings and COPPA compliance for your children
              </CardDescription>
            </CardHeader>
            <CardContent>
              <COPPACompliancePanel
                userProfile={userProfile}
                childProfiles={children}
                onUpdate={handleProfileUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
                <Badge variant="outline">Verified</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Role</h4>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.role === 'parent'
                      ? 'Parent Account'
                      : userProfile?.role || 'User'}
                  </p>
                </div>
                <Badge variant="secondary">{userProfile?.role || 'user'}</Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
