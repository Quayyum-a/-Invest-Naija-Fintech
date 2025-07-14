import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database, Eye, Search, RefreshCw } from "lucide-react";

interface TableInfo {
  name: string;
  columns: {
    name: string;
    type: string;
    notNull: boolean;
    primaryKey: boolean;
  }[];
  recordCount: number;
  sampleData: any[];
}

interface DatabaseInfo {
  tables: TableInfo[];
  summary: {
    totalTables: number;
    users: number;
    wallets: number;
    transactions: number;
    investments: number;
  };
}

export default function DatabaseViewer() {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/dev/database");
      const result = await response.json();

      if (result.success) {
        setDatabaseInfo(result.data);
      } else {
        setError(result.error || "Failed to load database info");
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/dev/database/${tableName}?limit=50`);
      const result = await response.json();

      if (result.success) {
        setTableData(result.data);
        setSelectedTable(tableName);
      } else {
        setError(result.error || "Failed to load table data");
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!customQuery.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/dev/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: customQuery }),
      });
      const result = await response.json();

      if (result.success) {
        setQueryResult(result.data);
      } else {
        setError(result.error || "Query execution failed");
      }
    } catch (err) {
      setError("Network error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const renderValue = (value: any) => {
    if (value === null) return <span className="text-gray-400">NULL</span>;
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Viewer</h1>
          <Badge variant="outline" className="text-yellow-600">
            Development Only
          </Badge>
        </div>
        <Button onClick={fetchDatabaseInfo} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">❌ {error}</p>
        </div>
      )}

      {databaseInfo && (
        <>
          {/* Database Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Database Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {databaseInfo.summary.totalTables}
                  </div>
                  <div className="text-sm text-gray-600">Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {databaseInfo.summary.users}
                  </div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {databaseInfo.summary.wallets}
                  </div>
                  <div className="text-sm text-gray-600">Wallets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {databaseInfo.summary.transactions}
                  </div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {databaseInfo.summary.investments}
                  </div>
                  <div className="text-sm text-gray-600">Investments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Tables ({databaseInfo.tables.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {databaseInfo.tables.map((table) => (
                  <Card
                    key={table.name}
                    className={`cursor-pointer transition-colors ${
                      selectedTable === table.name
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => fetchTableData(table.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{table.name}</h3>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{table.columns.length} columns</div>
                        <div>{table.recordCount} records</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table Data */}
          {tableData && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Table: {tableData.tableName} ({tableData.pagination.total}{" "}
                  records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Schema:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tableData.schema.map((column: any) => (
                      <Badge
                        key={column.name}
                        variant={column.primaryKey ? "default" : "secondary"}
                      >
                        {column.name} ({column.type})
                        {column.primaryKey && " 🔑"}
                        {column.notNull && " *"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {tableData.schema.map((column: any) => (
                          <TableHead key={column.name}>{column.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.records.map((record: any, index: number) => (
                        <TableRow key={index}>
                          {tableData.schema.map((column: any) => (
                            <TableCell key={column.name} className="max-w-48">
                              <div className="truncate">
                                {renderValue(record[column.name])}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {tableData.pagination.hasMore && (
                  <div className="mt-4 text-center">
                    <Badge variant="outline">
                      Showing {tableData.records.length} of{" "}
                      {tableData.pagination.total} records
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Custom Query */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Query (SELECT only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="SELECT * FROM users LIMIT 10;"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="min-h-20"
              />
              <Button
                onClick={executeCustomQuery}
                disabled={loading || !customQuery.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                Execute Query
              </Button>

              {queryResult && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">
                    Query Results ({queryResult.count} rows):
                  </h4>
                  <div className="overflow-auto max-h-64">
                    <pre className="bg-gray-100 p-3 rounded text-sm">
                      {JSON.stringify(queryResult.results, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-6 w-6 mx-auto animate-spin" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}
    </div>
  );
}
