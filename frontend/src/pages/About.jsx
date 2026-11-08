import { useEffect, useState } from "react";
import api from "../api/client";

export default function About() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/profile").then((res) => setProfile(res.data));
  }, []);

  if (!profile) return <p className="loading">Loading</p>;

  const links = Object.entries(profile.social || {}).filter(([, url]) => url);

  return (
    <section className="about">
      {profile.photo?.url && (
        <img src={profile.photo.url} alt={profile.name} className="portrait" />
      )}
      <div>
        <p className="eyebrow">About</p>
        <h1 className="page-title">{profile.name}</h1>
        {profile.tagline && <p className="lead">{profile.tagline}</p>}
        <p className="bio">{profile.bio}</p>

        {profile.location && <p className="meta">{profile.location}</p>}
        {links.length > 0 && (
          <ul className="social">
            {links.map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noreferrer">{name}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}