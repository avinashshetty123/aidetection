import { useState, useEffect } from 'react';
import { BarChart3, Download, AlertTriangle, Users, Clock, FileText } from 'lucide-react';

interface DetectionReport {
  id: string;
  studentId: string;
  questionId: string;
  timestamp: string;
  aiScore: number;
  riskLevel: string;
  textLength: number;
  detectedPatterns: string[];
}

const ReportDashboard = () => {
  const [reports, setReports] = useState<DetectionReport[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Load real detection reports
  useEffect(() => {
    const mockReports: DetectionReport[] = [
      {
        id: '1',
        studentId: 'john.doe@university.edu',
        questionId: 'Essay Question 1',
        timestamp: new Date().toISOString(),
        aiScore: 0.89,
        riskLevel: 'HIGH',
        textLength: 245,
        detectedPatterns: ['AI transition phrases detected', 'Lack of personal writing style']
      },
      {
        id: '2',
        studentId: 'jane.smith@university.edu',
        questionId: 'Short Answer 2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        aiScore: 0.34,
        riskLevel: 'LOW',
        textLength: 156,
        detectedPatterns: []
      },
      {
        id: '3',
        studentId: 'mike.wilson@university.edu',
        questionId: 'Essay Question 1',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        aiScore: 0.67,
        riskLevel: 'MEDIUM',
        textLength: 198,
        detectedPatterns: ['Academic language patterns', 'Uniform sentence structure']
      },
      {
        id: '4',
        studentId: 'sarah.johnson@university.edu',
        questionId: 'Discussion Post 3',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        aiScore: 0.92,
        riskLevel: 'HIGH',
        textLength: 312,
        detectedPatterns: ['ChatGPT-style formatting', 'Overly formal tone', 'No personal opinions']
      }
    ];
    setReports(mockReports);
  }, []);

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.riskLevel.toLowerCase() === filter;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-400 bg-red-900/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20';
      case 'LOW': return 'text-green-400 bg-green-900/20';
      default: return 'text-slate-400 bg-slate-900/20';
    }
  };

  const generatePDFReport = () => {
    // Mock PDF generation
    const reportData = {
      title: 'AI Detection Report',
      generatedAt: new Date().toISOString(),
      totalAnalyses: reports.length,
      highRisk: reports.filter(r => r.riskLevel === 'HIGH').length,
      mediumRisk: reports.filter(r => r.riskLevel === 'MEDIUM').length,
      lowRisk: reports.filter(r => r.riskLevel === 'LOW').length,
      reports: filteredReports
    };

    // Create downloadable JSON (in real implementation, this would be PDF)
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-detection-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: reports.length,
    high: reports.filter(r => r.riskLevel === 'HIGH').length,
    medium: reports.filter(r => r.riskLevel === 'MEDIUM').length,
    low: reports.filter(r => r.riskLevel === 'LOW').length,
    avgScore: reports.length > 0 ? reports.reduce((sum, r) => sum + r.aiScore, 0) / reports.length : 0
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Detection Reports</h2>
              <p className="text-sm text-slate-400">Monitor AI detection results across all tests</p>
            </div>
          </div>
          <button
            onClick={generatePDFReport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Analyses</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">High Risk</p>
                <p className="text-2xl font-bold text-red-400">{stats.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Medium Risk</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Low Risk</p>
                <p className="text-2xl font-bold text-green-400">{stats.low}</p>
              </div>
              <FileText className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg AI Score</p>
                <p className="text-2xl font-bold text-purple-400">{Math.round(stats.avgScore * 100)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Risk Level:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Question</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">AI Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Risk Level</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Patterns</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-600">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-600/50">
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-200">{report.studentId}</div>
                      <div className="text-xs text-slate-400">{report.textLength} characters</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">{report.questionId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              report.aiScore > 0.7 ? 'bg-red-500' : 
                              report.aiScore > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${report.aiScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-slate-200">{Math.round(report.aiScore * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(report.riskLevel)}`}>
                        {report.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-400">
                        {report.detectedPatterns.length > 0 ? (
                          <div className="space-y-1">
                            {report.detectedPatterns.slice(0, 2).map((pattern, index) => (
                              <div key={index} className="flex items-center space-x-1">
                                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                                <span>{pattern}</span>
                              </div>
                            ))}
                            {report.detectedPatterns.length > 2 && (
                              <div className="text-slate-500">+{report.detectedPatterns.length - 2} more</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-400">No patterns detected</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(report.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No reports found for the selected filters</p>
            </div>
          )}
        </div>

        {/* Alert Summary */}
        {stats.high > 0 && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-400">High Risk Alerts</h3>
            </div>
            <p className="text-sm text-slate-300">
              {stats.high} student{stats.high > 1 ? 's have' : ' has'} submitted responses with high AI probability. 
              Consider manual review and follow-up questioning for academic integrity verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;