
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { useLoading } from '../context/LoadingContext';
import PremiumLoader from '../components/PremiumLoader';

const Biography = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState({ cast: [], crew: [] });
    const { setIsLoading, stopLoading } = useLoading();

    const TMDB_API_KEY = '05587a49bd4890a9630d6c0e544e0f6f';
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&append_to_response=combined_credits`);
                const data = await res.json();
                setPerson(data);
                setCredits(data.combined_credits);
            } catch (err) {
                console.error("Failed to fetch person details", err);
            } finally {
                stopLoading();
            }
        };
        fetchData();
    }, [id]);

    if (!person) return null;

    // Calculate Age
    const getAge = (birthDate, deathDate) => {
        if (!birthDate) return 'N/A';
        const birth = new Date(birthDate);
        const end = deathDate ? new Date(deathDate) : new Date();
        let age = end.getFullYear() - birth.getFullYear();
        const m = end.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Filter: Only TV Series Acted
    const acting = credits.cast
        .filter(c => c.media_type === 'tv')
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);

    return (
        <div style={{ padding: '0', background: 'black', minHeight: '100vh', color: 'white', overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>
                {`
                    .bio-layout {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 40px 20px;
                        gap: 30px;
                        width: 100%;
                        max-width: 800px; /* Constrain Bio for readability */
                        margin: 0 auto;
                    }
                    .profile-section {
                        width: 100%;
                        max-width: 250px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .bio-text-area {
                        text-align: center;
                        width: 100%;
                    }
                    .acting-scroll-area {
                        display: flex;
                        gap: 15px;
                        overflow-x: auto;
                        padding-bottom: 20px;
                        scrollbar-width: none;
                        width: 100%;
                        justify-content: center;
                    }
                    .acting-item { 
                        width: 120px; 
                        flex-shrink: 0;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }

                    @media (max-width: 768px) {
                        .bio-layout { 
                            padding: 20px 15px !important; 
                            gap: 20px !important; 
                        }
                        .profile-section { 
                            max-width: 160px !important; 
                        }
                        .bio-text-area h1 {
                            font-size: 1.8rem !important;
                        }
                        .bio-text-area p {
                            font-size: 1rem !important;
                            line-height: 1.6 !important;
                        }
                        .acting-scroll-area {
                            margin: 0 -15px !important;
                            padding: 0 15px 20px !important;
                            justify-content: flex-start !important; /* Edge-to-edge feel */
                        }
                        .acting-poster { 
                            width: 90px !important; 
                            height: 135px !important; 
                        }
                        .acting-item { 
                            width: 90px !important; 
                        }
                    }
                `}
            </style>

            {/* Header / Back */}
            <div style={{ width: '100%', padding: '20px', borderBottom: '1px solid #222', background: 'rgba(0,0,0,0.8)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#FFCC00', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.2rem', gap: '5px' }}>
                    <MdArrowBack /> Back
                </button>
                <div style={{ marginLeft: '20px', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>Biography</div>
            </div>

            <div className="bio-layout">
                {/* 1. Profile Photo */}
                <div className="profile-section">
                    <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/h632${person.profile_path}` : 'https://via.placeholder.com/250x375'}
                        alt={person.name}
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    />
                    <div style={{ marginTop: '15px', color: '#888', fontSize: '0.85rem', textAlign: 'center' }}>
                        {person.birthday && <span>Born: {person.birthday}</span>}
                        {person.place_of_birth && <div style={{ marginTop: '4px' }}>{person.place_of_birth}</div>}
                    </div>
                </div>

                {/* 2. Name & Bio */}
                <div className="bio-text-area">
                    <h1 style={{ color: '#FFCC00', marginTop: 0, fontSize: '2.4rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
                        {person.name}
                    </h1>

                    <div style={{
                        lineHeight: '1.8',
                        color: '#ddd',
                        fontSize: '1.1rem',
                        whiteSpace: 'pre-line',
                        textAlign: 'center'
                    }}>
                        {person.biography || "Biography currently unavailable."}
                    </div>
                </div>

                {/* 3. TV Series Roles */}
                {acting.length > 0 && (
                    <div style={{ width: '100%', marginTop: '30px' }}>
                        <h2 style={{ color: '#FFCC00', fontSize: '1.2rem', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Cast Roles in Series
                        </h2>
                        <div className="acting-scroll-area">
                            {acting.map(c => (
                                <div
                                    key={c.credit_id}
                                    className="acting-item"
                                    onClick={() => navigate(`/tv/${c.id}`)}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <img
                                        onError={(e) => e.target.style.display = 'none'}
                                        src={c.poster_path ? `https://image.tmdb.org/t/p/w200${c.poster_path}` : 'https://via.placeholder.com/120x180'}
                                        alt={c.name}
                                        className="acting-poster"
                                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <div style={{ fontSize: '0.85rem', marginTop: '8px', fontWeight: '800', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {c.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.character}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Biography;
