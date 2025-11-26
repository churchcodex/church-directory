import Dashboard from "@/components/Dashboard";
import { Church, Users, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          First Love Church
        </h1>
        <p className="text-xl text-muted-foreground">Manage your churches and pastors with ease</p>
      </div>

      <Dashboard />

      {/* <div className="grid md:grid-cols-3 gap-6 pt-8">
        <div className="p-6 rounded-lg bg-card border border-muted hover:border-primary/50 transition-all">
          <Church className="h-12 w-12 mx-auto mb-4 text-purple-500" />
          <h3 className="text-xl font-semibold mb-2 text-center">Church Management</h3>
          <p className="text-muted-foreground text-center">
            Track churches, locations, members, and financial information.
          </p>
        </div>
        <div className="p-6 rounded-lg bg-card border border-muted hover:border-primary/50 transition-all">
          <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-semibold mb-2 text-center">Clergy Directory</h3>
          <p className="text-muted-foreground text-center">
            Manage clergy members, positions, and church associations.
          </p>
        </div>
        <div className="p-6 rounded-lg bg-card border border-muted hover:border-primary/50 transition-all">
          <Database className="h-12 w-12 mx-auto mb-4 text-cyan-500" />
          <h3 className="text-xl font-semibold mb-2 text-center">Secure Storage</h3>
          <p className="text-muted-foreground text-center">All data securely stored with MongoDB and Cloudinary.</p>
        </div>
      </div> */}
    </div>
  );
}
