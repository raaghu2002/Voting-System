import React, { useState, useEffect } from 'react';
import { Vote, Users, Clock, CheckCircle, XCircle, Trophy, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const VotingSystem = () => {
  const [page, setPage] = useState('login');
  const [voterId, setVoterId] = useState('');
  const [voter, setVoter] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [timeUntilStart, setTimeUntilStart] = useState(null);
  const [timeUntilEnd, setTimeUntilEnd] = useState(null);
  const [votingStatus, setVotingStatus] = useState('waiting');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Candidate images from public folder
  const candidateImages = {
    'Abrar': '/images/abrar.jpg',
    'Dishanth': '/images/dishanth.jpg'
  };

  const VOTING_START = new Date('2025-11-23T18:00:00');
  const VOTING_END = new Date('2025-11-23T20:00:00');

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      if (now < VOTING_START) {
        const diff = VOTING_START - now;
        setTimeUntilStart(diff);
        setVotingStatus('waiting');
      } else if (now >= VOTING_START && now < VOTING_END) {
        const diff = VOTING_END - now;
        setTimeUntilEnd(diff);
        setVotingStatus('active');
      } else {
        setVotingStatus('ended');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load candidates
  useEffect(() => {
    loadCandidates();
  }, []);

  const formatTime = (ms) => {
    if (!ms) return '00:00:00';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      if (data) setCandidates(data);
    } catch (err) {
      console.error('Error loading candidates:', err);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!voterId.trim()) {
      setError('Please enter your Voter ID');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('voters')
        .select('*')
        .eq('voter_id', voterId.trim())
        .single();
      
      if (error || !data) {
        setError('Invalid Voter ID. Please check and try again.');
        return;
      }
      
      setVoter(data);
      setPage('dashboard');
    } catch (err) {
      setError('Error verifying Voter ID. Please try again.');
    }
  };

  const handleVote = async (candidateId) => {
    if (votingStatus !== 'active') {
      setError('Voting is not currently active');
      return;
    }

    if (voter.has_voted) {
      setError('You have already cast your vote');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('cast_vote', {
        p_voter_id: voter.voter_id,
        p_candidate_id: candidateId
      });

      if (error) throw error;

      if (data?.success) {
        setSuccess('Your vote has been recorded successfully!');
        setVoter({ ...voter, has_voted: true });
        setTimeout(() => {
          loadCandidates();
        }, 1000);
      } else {
        setError(data?.message || 'Failed to cast vote');
      }
    } catch (err) {
      console.error('Vote error:', err);
      setError('Error casting vote. Please try again.');
    }
  };

  const getWinner = () => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) => 
      (prev.vote_count > current.vote_count) ? prev : current
    );
  };

  // Login Page
  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <Vote className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" style={{fontFamily: 'serif'}}>
              ಸಹಾಯಕ ಮಿತ್ರರ ಬಳಗ
            </h1>
            <p className="text-sm sm:text-base text-gray-600">ಉಪಾಧ್ಯಕ್ಷ ಚುನಾವಣೆ</p>
          </div>

          {/* Countdown Display */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-orange-100 to-green-100 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-600" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {votingStatus === 'waiting' && 'Voting starts in:'}
                {votingStatus === 'active' && 'Voting ends in:'}
                {votingStatus === 'ended' && 'Voting has ended'}
              </span>
            </div>
            <div className="text-center text-2xl sm:text-3xl font-bold text-orange-600">
              {votingStatus === 'waiting' && formatTime(timeUntilStart)}
              {votingStatus === 'active' && formatTime(timeUntilEnd)}
              {votingStatus === 'ended' && '00:00:00'}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Enter Your Voter ID
              </label>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value)}
                placeholder="Enter Voter ID"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-orange-600 hover:to-green-600 transition-all active:scale-95"
            >
              Continue
            </button>
          </div>

          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
            <p>Voting Time: 6:00 PM - 8:00 PM</p>
            <p className="mt-1">November 23, 2025</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 flex-col sm:flex-row gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{fontFamily: 'serif'}}>
                ಸಹಾಯಕ ಮಿತ್ರರ ಬಳಗ
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Welcome, {voter?.name}</p>
            </div>
            <button
              onClick={() => {
                setVoter(null);
                setVoterId('');
                setPage('login');
                setError('');
                setSuccess('');
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Status Banner */}
          <div className={`p-3 sm:p-4 rounded-lg ${
            votingStatus === 'waiting' ? 'bg-yellow-100' :
            votingStatus === 'active' ? 'bg-green-100' :
            'bg-blue-100'
          }`}>
            <div className="flex items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-semibold">
                  {votingStatus === 'waiting' && 'Voting starts in:'}
                  {votingStatus === 'active' && 'Time remaining:'}
                  {votingStatus === 'ended' && 'Results:'}
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold">
                {votingStatus === 'waiting' && formatTime(timeUntilStart)}
                {votingStatus === 'active' && formatTime(timeUntilEnd)}
                {votingStatus === 'ended' && 'Final'}
              </span>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 text-green-700">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-sm sm:text-base font-semibold">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 text-red-700">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="text-sm sm:text-base font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Results Display (After Voting Ends) */}
        {votingStatus === 'ended' && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="text-center mb-4 sm:mb-6">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-500" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Winner</h2>
            </div>
            <div className="text-center p-4 sm:p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                {getWinner()?.kannada_name}
              </h3>
              <p className="text-lg sm:text-2xl text-gray-600">{getWinner()?.name}</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-3 sm:mt-4">
                {getWinner()?.vote_count} Votes
              </p>
            </div>
          </div>
        )}

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="text-center mb-3 sm:mb-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 bg-gradient-to-br from-orange-200 to-green-200 rounded-full flex items-center justify-center overflow-hidden">
                  {(candidate.image_url || candidateImages[candidate.name]) ? (
                    <img 
                      src={candidate.image_url || candidateImages[candidate.name]} 
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <Users 
                    className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700" 
                    style={{display: (candidate.image_url || candidateImages[candidate.name]) ? 'none' : 'block'}} 
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1" style={{fontFamily: 'serif'}}>
                  {candidate.kannada_name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{candidate.name}</p>
              </div>

              {/* Vote Count (Show after voting or for admins) */}
              {(votingStatus === 'ended' || voter?.is_admin) && (
                <div className="mb-3 sm:mb-4 p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600">Votes Received</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600">{candidate.vote_count}</p>
                </div>
              )}

              {/* Vote Button */}
              {votingStatus === 'active' && !voter?.has_voted && (
                <button
                  onClick={() => handleVote(candidate.id)}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-orange-600 hover:to-green-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Vote className="w-4 h-4 sm:w-5 sm:h-5" />
                  Vote
                </button>
              )}

              {voter?.has_voted && votingStatus === 'active' && (
                <div className="w-full bg-gray-200 text-gray-600 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-center">
                  Vote Cast
                </div>
              )}

              {votingStatus === 'waiting' && (
                <div className="w-full bg-yellow-100 text-yellow-700 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-center">
                  Voting Not Started
                </div>
              )}

              {votingStatus === 'ended' && (
                <div className="w-full bg-blue-100 text-blue-700 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-center">
                  Voting Ended
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Admin Panel */}
        {voter?.is_admin && (
          <div className="mt-4 sm:mt-6 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              Admin Panel
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Total Votes Cast</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {candidates.reduce((sum, c) => sum + c.vote_count, 0)} / 17
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600">Voting Status</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 capitalize">{votingStatus}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingSystem;