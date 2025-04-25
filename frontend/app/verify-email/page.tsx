import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>We've sent you a verification link to your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Please check your email and click the verification link to complete your registration.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/login">Return to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
