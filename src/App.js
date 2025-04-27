import React, { useState } from 'react';

function App() {
  const [mode, setMode] = useState('temp');
  const [directory, setDirectory] = useState('');
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
    setDirectory('');
  };

  const handleDirectoryChange = (e) => {
    setDirectory(e.target.value);
  };

  const uploadFile = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    if (mode === 'final' && !directory) {
      alert('Please enter the directory path for final mode.');
      return;
    }

    setLoading(true);
    setSummary('');

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      if (mode === 'final') {
        formData.append('directory', directory);
      }

      // Call upload lambda
      const uploadResponse = await fetch('/upload-lambda', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();

      // Call AISummarizer lambda with s3 directory info
      const summaryResponse = await fetch('/aisummarizer-lambda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Directory: uploadResult.s3Directory }),
      });

      if (!summaryResponse.ok) {
        throw new Error('Summary retrieval failed');
      }

      const summaryResult = await summaryResponse.json();
      setSummary(summaryResult.summary);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 font-sans">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">PDF Summarizer</h1>

      <div className="mb-6 w-full max-w-md">
        <label className="inline-flex items-center mr-6">
          <input
            type="radio"
            name="mode"
            value="temp"
            checked={mode === 'temp'}
            onChange={handleModeChange}
            className="form-radio text-blue-600"
          />
          <span className="ml-2 text-gray-700">Temp Mode</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="mode"
            value="final"
            checked={mode === 'final'}
            onChange={handleModeChange}
            className="form-radio text-blue-600"
          />
          <span className="ml-2 text-gray-700">Final Mode</span>
        </label>
      </div>

      {mode === 'final' && (
        <input
          type="text"
          placeholder="Enter S3 directory path"
          value={directory}
          onChange={handleDirectoryChange}
          className="mb-6 w-full max-w-md p-2 border border-gray-300 rounded"
        />
      )}

      <input
        type="file"
        accept=".pdf,.zip"
        onChange={handleFileChange}
        className="mb-6 w-full max-w-md"
      />

      <button
        onClick={uploadFile}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload and Summarize'}
      </button>

      {summary && (
        <div className="mt-8 w-full max-w-md bg-white p-4 rounded shadow text-gray-800 whitespace-pre-wrap">
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}

export default App;
