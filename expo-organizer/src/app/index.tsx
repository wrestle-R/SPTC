import { Redirect } from "expo-router";
import { StateView } from "@/components/ui";
import { useOrganizerAuth } from "@/providers/auth-provider";
export default function Index() { const { user, loading } = useOrganizerAuth(); if (loading) return <StateView loading />; return <Redirect href={user ? "/home" : "/login"} />; }
