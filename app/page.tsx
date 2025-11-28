import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="space-y-12 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-5xl lg:text-7xl  font-bold tracking-tight bg-linear-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          First Love Church
        </h1>
      </div>
      <Dashboard />
    </div>
  );
}
