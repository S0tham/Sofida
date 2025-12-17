import { TrendingUp, TrendingDown, Target, Award, Calendar, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ProgressieView() {
  // Data voor grafieken
  const weekData = [
    { dag: 'Ma', uren: 3.5 },
    { dag: 'Di', uren: 4.2 },
    { dag: 'Wo', uren: 2.8 },
    { dag: 'Do', uren: 5.1 },
    { dag: 'Vr', uren: 3.7 },
    { dag: 'Za', uren: 2.5 },
    { dag: 'Zo', uren: 1.8 },
  ];

  const vakkenData = [
    { vak: 'Wiskunde B', voortgang: 78, gradient: '#5D64BE' },
    { vak: 'Scheikunde', voortgang: 65, gradient: '#F57955' },
    { vak: 'Engels', voortgang: 82, gradient: '#90D5FE' },
    { vak: 'Biologie', voortgang: 71, gradient: '#FAAA75' },
    { vak: 'Natuurkunde', voortgang: 58, gradient: '#5D64BE' },
  ];

  const maandData = [
    { week: 'W1', uren: 18.5 },
    { week: 'W2', uren: 22.3 },
    { week: 'W3', uren: 19.8 },
    { week: 'W4', uren: 25.1 },
  ];

  const stats = [
    {
      label: 'Totaal deze week',
      value: '23.6 uur',
      change: '+12%',
      trend: 'up',
      icon: Clock,
      color: '#5D64BE',
    },
    {
      label: 'Gemiddelde per dag',
      value: '3.4 uur',
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
      color: '#90D5FE',
    },
    {
      label: 'Voltooide taken',
      value: '47/52',
      change: '90%',
      trend: 'up',
      icon: Target,
      color: '#FAAA75',
    },
    {
      label: 'Streak',
      value: '12 dagen',
      change: 'Nieuw record!',
      trend: 'up',
      icon: Award,
      color: '#F57955',
    },
  ];

  return (
    <div className="h-full overflow-auto scrollbar-hide">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Progressie Dashboard</h1>
          <p className="text-gray-500">Jouw studiestatistieken en voortgang</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  {stat.trend === 'up' ? (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="text-3xl text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Studietijd deze week */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-gray-900 mb-6">Studietijd deze week</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dag" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="uren" radius={[8, 8, 0, 0]}>
                  {weekData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#5D64BE" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend afgelopen maand */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-gray-900 mb-6">Trend afgelopen maand</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={maandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="uren"
                  stroke="#90D5FE"
                  strokeWidth={3}
                  dot={{ fill: '#90D5FE', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voortgang per vak */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-gray-900 mb-6">Voortgang per vak</h3>
          <div className="space-y-6">
            {vakkenData.map((vak) => (
              <div key={vak.vak}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900">{vak.vak}</span>
                  <span className="text-gray-600">{vak.voortgang}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${vak.voortgang}%`,
                      background: `linear-gradient(to right, ${vak.gradient}, ${vak.gradient}dd)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
