import Link from 'next/link'

export function PngToGifExplainer() {
  return (
    <div>
      <h2>What is PNG?</h2>
      <p>
        PNG was created by a group of developers on a public mailing list
        in 1995. <strong>Thomas Boutell</strong> was the driving force
        behind the creation of PNG, which was designed to be a{' '}
        <strong>replacement for GIF images on the web</strong>. At the
        time, GIF was the most common format for small images on the web,
        but <strong>Unisys</strong> announced that they would begin
        enforcing a patent on the particular form of compression that GIF
        used. This meant that any tool that saved GIF images would have to
        pay royalties, which wasn&rsquo;t what most web developers wanted
        to hear. The PNG group set out to create a <strong>lossless image
        format</strong> that was patent- and royalty-free, supported{' '}
        <strong>full alpha transparency</strong>, and used true color
        rather than the 256 colors of GIF. In 1996, PNG became a{' '}
        <strong>W3C standard</strong> and has since become the default
        lossless image format on the web.
      </p>
      <p>
        This format is often used by designers to save files like{' '}
        <strong>screenshots, logos, and UI mockups</strong> that have
        lots of sharp edges, text, or transparency. These types of images
        look better with PNG than they would with other formats. The
        files are typically large, though &mdash; the lossless nature of
        PNG means that every pixel is saved without loss, so a
        high-quality photo can be <strong>3 to 8 times larger</strong>{' '}
        than the same image saved as a{' '}
        <Link href="/png-to-jpg/">JPG</Link> or{' '}
        <Link href="/png-to-webp/">WebP</Link> file. PNG files{' '}
        <strong>do not support animation</strong>.
      </p>

      <h2>What is APNG?</h2>
      <p>
        The <strong>APNG (or Animated PNG)</strong> is the animated GIF
        equivalent for PNG files. It is saved as a single PNG file that
        can contain <strong>multiple frames</strong>, plus other GIF-like
        properties such as <strong>playback time</strong>. So it&rsquo;s
        a GIF-style animation on steroids. It basically has PNG&rsquo;s{' '}
        <strong>full color-range support</strong> and{' '}
        <strong>real alpha transparency</strong>, not the blocky 256-color
        palette.
      </p>
      <p>
        In 2004, two Mozilla engineers,{' '}
        <strong>Stuart Parmenter and Vladimir Vukićević</strong>, worked
        on adding animation to PNG using the APNG format. Already the PNG
        Group had defined a method for animation in the form of the{' '}
        <strong>MNG (Multiple-image Network Graphics)</strong>{' '}
        specification. The MNG specification was large and complex, and
        no browser had implemented it. APNG was designed to be simple;
        the first frame of the animation could be saved as a regular PNG
        file so users without the ability to view APNG could still see
        the first frame. The remaining frames would be stored in optional
        chunks within the PNG file that would be ignored by any PNG
        viewer that did not support animation. The PNG Group would go on
        to formally reject APNG in favor of MNG in 2007, but{' '}
        <strong>Mozilla implemented support for it in Firefox</strong>. A
        decade of use by a large number of people would ultimately lead
        to the media type for animated PNG images,{' '}
        <strong>image/apng</strong>, being registered with IANA in 2017,
        and support for animated PNGs being added to the WHATWG HTML spec.
      </p>
      <p>
        However, there is a catch. Outside of Firefox, support for the
        APNG format isn&rsquo;t universal.{' '}
        <strong>Chrome didn&rsquo;t officially support this format until
        2017</strong>, and <strong>Microsoft Edge only added support for
        it in 2019</strong>. Today, most major browsers support this
        format, but there&rsquo;s another hurdle that may take longer to
        implement. The biggest hurdle for this format is support from
        major social media platforms like{' '}
        <strong>Slack, Discord, Twitter/X, Instagram, iMessage, and major
        email clients and content management systems</strong>.
      </p>

      <h2>What is GIF?</h2>
      <p>
        <strong>GIF (Graphics Interchange Format)</strong> was created by
        CompuServe in 1987 by a team including <strong>Steve Wilhite</strong>.
        At the time, CompuServe was one of the major online services,
        delivered over the then-slow speed of dial-up modems. Users
        connected to the online service from a variety of computers (PCs,
        Macs, Amigas, Ataris, etc.), each with their own means of
        representing images on screen. GIF was devised as a{' '}
        <strong>small downloadable image file</strong> that could be
        easily displayed in full color on any online computer.
      </p>
      <p>
        Later, in 1987, they created the first animation. Although
        animation was only experimental for a few years, GIF in the end
        was the first and still the <strong>most widely supported way to
        put animation online</strong>. For almost 40 years now, all
        browsers, messaging programs, forums, CMS systems, and even email
        programs play GIFs without being asked.
      </p>
      <p>
        Technically, the format is showing its age. It encodes images at
        a <strong>maximum of 256 colors per frame</strong>. Transparency
        in GIFs is also <strong>binary</strong> (i.e., fully opaque or
        fully transparent &mdash; no partial transparency), so
        you&rsquo;ll notice jagged edges with transparent images.
      </p>
      <p>
        GIF files use an <strong>older compression algorithm</strong>,
        which results in larger file sizes and takes up more space. Yet
        GIFs have the massive advantage of <strong>working on just about
        every web platform out there</strong>. Sure, their quality
        isn&rsquo;t great, but the convenience of being able to upload
        just about anywhere makes them the better choice for most people.
      </p>

      <h2>Why convert PNG or APNG to GIF?</h2>
      <p>
        If you&rsquo;re uploading an animation to a platform that{' '}
        <strong>only accepts GIFs</strong>, like GIPHY, you will need to
        convert it to this format first before submitting anything. If
        you upload to any of the major social media platforms like
        Twitter or Discord, it will <strong>only show the first APNG
        frame</strong> and not the whole animation. If you want to share
        the APNG using an email program like Outlook, the best option
        would be converting it to a GIF format first.
      </p>
      <p>
        You&rsquo;re sending it to someone who doesn&rsquo;t have access
        to <strong>modern software that can read and display APNG
        animation</strong>.
      </p>

      <h2>Why keep it as PNG or APNG?</h2>
      <ul>
        <li>
          <strong>Quality:</strong> PNG uses a lossless format, meaning
          there&rsquo;s <strong>no quality loss during encoding</strong>.
          So if you need to save graphic files like screenshots or logos,
          this is the format to choose.
        </li>
        <li>
          <strong>Smaller File Size:</strong> As already mentioned,
          GIF&rsquo;s compression is from 1987, which isn&rsquo;t the
          most efficient. Saving it in an APNG format will result in a{' '}
          <strong>smaller file size for equivalent animations</strong>.
          If your GIFs are too large, run them through our{' '}
          <Link href="/compress-gif/">GIF compressor</Link> to reduce the
          file size.
        </li>
        <li>
          <strong>Transparency:</strong> With PNG and APNG, you can use
          real transparency with <strong>soft and anti-aliased edges</strong>.
          GIF transparency, on the other hand, is just a simple on/off
          switch. If a pixel is semi-transparent, then it has to choose a
          color, which nearly always results in a visible fringe with
          hard edges.
        </li>
      </ul>
      <p>
        The rule of thumb is to <strong>convert to GIF if you&rsquo;re
        unsure whether the recipient can open the APNG animation</strong>.
        Keep it as a PNG (or APNG) to archive high-quality graphic assets
        or animation.
      </p>
    </div>
  )
}
