"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerSchema, type RegisterInput } from "@/lib/validations"

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState(1)
  const [familySetup, setFamilySetup] = useState<"create" | "join" | "">("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema)
  })

  const role = watch("role")
  const familyCode = watch("familyCode")
  const familyName = watch("familyName")

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || "Registration failed")
        return
      }

      // Auto sign in after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (signInResult?.error) {
        setError("Registration successful but login failed. Please try logging in.")
      } else {
        // Navigate to settings with onboarding flag
        router.push("/settings?showOnboarding=true")
        router.refresh()
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setStep(2)
  const prevStep = () => setStep(1)

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          {step === 1 ? "Choose your role to get started" : "Complete your registration"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password (min 8 characters)"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>I am a:</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="PARENT"
                      {...register("role")}
                      className="text-primary"
                    />
                    <span>Parent</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="CHILD"
                      {...register("role")}
                      className="text-primary"
                    />
                    <span>Child</span>
                  </label>
                </div>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <Button type="button" onClick={nextStep} className="w-full" disabled={!role}>
                Next
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Family Setup:</Label>
                  <div className="space-y-3">
                    {role === "PARENT" && (
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="create"
                          name="familySetup"
                          checked={familySetup === "create"}
                          onChange={() => {
                            setFamilySetup("create")
                            setValue("familyCode", "")
                          }}
                          className="text-primary"
                        />
                        <span>Create new family</span>
                      </label>
                    )}
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="join"
                        name="familySetup"
                        checked={familySetup === "join"}
                        onChange={() => {
                          setFamilySetup("join")
                          setValue("familyName", "")
                        }}
                        className="text-primary"
                      />
                      <span>Join existing family</span>
                    </label>
                  </div>
                </div>

                {/* Show family name input when creating new family */}
                {role === "PARENT" && familySetup === "create" && (
                  <div className="space-y-2">
                    <Label htmlFor="familyName">Family Name</Label>
                    <Input
                      id="familyName"
                      type="text"
                      placeholder="Enter your family name"
                      {...register("familyName")}
                    />
                    {errors.familyName && (
                      <p className="text-sm text-destructive">{errors.familyName.message}</p>
                    )}
                  </div>
                )}

                {/* Show family code input when joining */}
                {familySetup === "join" && (
                  <div className="space-y-2">
                    <Label htmlFor="familyCode">Family Code</Label>
                    <Input
                      id="familyCode"
                      type="text"
                      placeholder="Enter 8-character family code"
                      maxLength={8}
                      {...register("familyCode")}
                    />
                    {errors.familyCode && (
                      <p className="text-sm text-destructive">{errors.familyCode.message}</p>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}